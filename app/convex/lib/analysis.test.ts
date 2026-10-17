import { afterEach, describe, expect, it, vi } from "vitest"
import { analyse, type AnalysisAnswer, estimateTotals, manifestFromLink } from "./analysis"
import { type Ask } from "./llm"
import { type PrdAnswer } from "./prd"
import { RECORDED_ANSWERS } from "./recordedAnswers"
import { SEEDED_TEMPLATE } from "./seededTemplate"

const requirements = (RECORDED_ANSWERS.prd() as PrdAnswer).requirements
const recordedAnalysis = RECORDED_ANSWERS.analysis() as AnalysisAnswer
const repoUrl = "https://github.com/example/starter"

function modelAnswering(...answers: unknown[]) {
  const ask = vi.fn<Ask>()
  for (const json of answers) {
    ask.mockResolvedValueOnce({ json, model: "test-model" })
  }
  return ask
}

function githubServing(files: Record<string, string>) {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const path = (input as string).replace(`https://api.github.com/repos/example/starter/`, "")
    const file = files[path]
    return Promise.resolve(new Response(file ?? "Not Found", { status: file ? 200 : 404 }))
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("a template added by its link", () => {
  it("reads the README and package.json through the GitHub API and keeps the model's manifest", async () => {
    githubServing({ readme: "# Starter", "contents/package.json": '{"name":"starter"}' })
    const ask = modelAnswering(SEEDED_TEMPLATE.manifest)

    const result = await manifestFromLink(`${repoUrl}.git`, ask)

    expect(result).toMatchObject({ source: "link", model: "test-model", problem: null })
    expect(ask.mock.calls[0]?.[0].data).toBe(
      'README:\n# Starter\n\npackage.json:\n{"name":"starter"}',
    )
  })

  it("falls back to the seeded manifest, with the reason, when the link can't be analysed", async () => {
    githubServing({})
    const ask = modelAnswering({ stack: "one string" })

    expect(await manifestFromLink("https://gitlab.com/example/starter", ask)).toMatchObject({
      source: "seeded",
      problem: "The link isn't a GitHub repository.",
    })
    expect(await manifestFromLink(repoUrl, ask)).toMatchObject({
      source: "seeded",
      problem: "GitHub didn't return the repository's README.",
    })

    githubServing({ readme: "# Starter" })
    const malformed = await manifestFromLink(repoUrl, ask)
    expect(malformed.source).toBe("seeded")
    expect(malformed.manifest).toEqual(SEEDED_TEMPLATE.manifest)
    expect(malformed.problem).toContain("The manifest came back malformed")
  })
})

describe("the verdicts", () => {
  it("accepts the recorded analysis: one verdict per recorded requirement", async () => {
    const result = await analyse(
      SEEDED_TEMPLATE.manifest,
      requirements,
      modelAnswering(recordedAnalysis),
    )

    expect(result.problems).toEqual([])
  })

  it("asks again when a requirement has no verdict or one is unsupported with no way out", async () => {
    const [first, second] = recordedAnalysis.verdicts
    const flawed = {
      ...recordedAnalysis,
      verdicts: [{ ...first, verdict: "notSupported", hours: 0 }, second, second],
    }
    const ask = modelAnswering(flawed, flawed)

    const result = await analyse(SEEDED_TEMPLATE.manifest, requirements.slice(0, 3), ask)

    expect(ask).toHaveBeenCalledTimes(2)
    expect(result.problems).toEqual([
      "FR-3 has no verdict.",
      "FR-2 is not a requirement, or has a second verdict.",
      "FR-1 is not supported, with no alternative or estimate.",
    ])
  })
})

describe("the estimate", () => {
  it("adds the verdicts' hours and $/month to the template's free-plan cost, the breaks apart", () => {
    expect(estimateTotals(recordedAnalysis.verdicts, SEEDED_TEMPLATE.manifest)).toEqual({
      totalHours: 46,
      infraMonthlyUsd: 0,
    })
    expect(
      estimateTotals(
        [
          { hours: 2, infraMonthlyUsd: 5 },
          { hours: 1.5, infraMonthlyUsd: 0 },
        ],
        { ...SEEDED_TEMPLATE.manifest, monthlyCost: { freeUsd: 1, paidUsd: 25, notes: "" } },
      ),
    ).toEqual({ totalHours: 3.5, infraMonthlyUsd: 6 })
  })
})
