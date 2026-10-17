import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Runs one stage skill headless on the made-up fixture client and checks what its "done when"
// promises: npm run skill-test -- <skill>. The fixture holds the client after every stage; the
// test deletes what the skill produces, runs it, and expects the files back and the stage set.

const REPO = fileURLToPath(new URL("../..", import.meta.url))
const FIXTURE = path.join(REPO, ".claude/skills/prd/fixture")
const SLUG = "seating-demo"
const CLIENT = `clients/${SLUG}`
const STARTING_STAGE = "none"

interface SkillCase {
  args: string
  produces: string[]
  stage: string
  expected: Record<string, RegExp[]>
  addDir?: string
}

const CASES: Record<string, SkillCase> = {
  interview: {
    args: "inbox/interview.txt",
    produces: ["interview"],
    stage: "interview",
    expected: { "interview/transcript-01.md": [/drag the tables around/] },
  },
  prd: {
    args: "",
    produces: ["prd.md", "decisions.md"],
    stage: "prd",
    expected: {
      "prd.md": [/\| FR-1 /, /\| NFR-1 /, /\| must /, /## Out of scope/, /## Flagged/],
      "decisions.md": [/- D-1 /],
    },
  },
  "analyze-template": {
    args: REPO,
    produces: ["analysis.md"],
    stage: "analysis",
    expected: { "analysis.md": [/## Manifest/, /## Verdicts/, /\| FR-1 /, /\| NFR-1 /] },
    addDir: REPO,
  },
  estimate: {
    args: "",
    produces: ["estimate.md"],
    stage: "analysis",
    expected: { "estimate.md": [/hours/i, /\$\d+/, /free tier/i] },
  },
  prototype: {
    args: "--mockup-only",
    produces: ["prototype"],
    stage: "prototype",
    expected: { "prototype/mockup.html": [/<html/i], "README.md": [/prototype\/mockup\.html/] },
  },
  feedback: {
    args: "inbox/feedback.txt",
    produces: ["feedback"],
    stage: "feedback",
    expected: { "feedback/feedback-01.md": [/## What works/, /## What doesn't/] },
  },
  handover: {
    args: "https://seating-demo.example.com",
    produces: ["handover.md"],
    stage: "final",
    expected: { "handover.md": [/seating-demo\.example\.com/, /- \[ \] /] },
  },
}

function prepareWorkspace(skill: string, skillCase: SkillCase): string {
  const workspace = mkdtempSync(path.join(tmpdir(), `skill-test-${skill}-`))
  cpSync(FIXTURE, workspace, { recursive: true })
  cpSync(path.join(REPO, ".claude/skills", skill), path.join(workspace, ".claude/skills", skill), {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}fixture`),
  })
  for (const output of skillCase.produces) {
    rmSync(path.join(workspace, CLIENT, output), { recursive: true, force: true })
  }
  const statePath = path.join(workspace, CLIENT, "state.json")
  const state = JSON.parse(readFileSync(statePath, "utf8")) as Record<string, unknown>
  writeFileSync(statePath, JSON.stringify({ ...state, stage: STARTING_STAGE }))
  return workspace
}

function runSkill(skill: string, skillCase: SkillCase, workspace: string): void {
  const prompt = `/${skill} ${SLUG} ${skillCase.args}\n\nThis is a test run: add --dry-run to the client-state.ts command.`
  const result = spawnSync(
    "claude",
    [
      ["-p", prompt],
      ["--model", "sonnet"],
      ["--setting-sources", "project"],
      ["--strict-mcp-config"],
      ["--permission-mode", "acceptEdits"],
      ["--allowedTools", "Bash(node:*)", "Bash(grep:*)", "Bash(ls:*)", "Bash(mkdir:*)"],
      skillCase.addDir ? ["--add-dir", skillCase.addDir] : [],
    ].flat(),
    { cwd: workspace, encoding: "utf8", timeout: 600_000 },
  )
  console.log(result.stdout)
  if (result.status !== 0) {
    throw new Error(`claude exited with ${String(result.status)}: ${result.stderr}`)
  }
}

function quotesNotInTranscript(prd: string, transcript: string): string[] {
  const normalize = (text: string) => text.replace(/[“”]/g, '"').replace(/\s+/g, " ")
  const spoken = normalize(transcript)
  return prd
    .split("\n")
    .filter((line) => /^\| N?FR-\d+ /.test(line) && !line.includes("quote not found"))
    .map((line) => line.split("|").at(-2)?.trim().replace(/^"|"$/g, "") ?? "")
    .filter((quote) => !spoken.includes(normalize(quote)))
}

function failures(skill: string, skillCase: SkillCase, workspace: string): string[] {
  const client = path.join(workspace, CLIENT)
  const read = (file: string) => readFileSync(path.join(client, file), "utf8")
  const missing = Object.entries(skillCase.expected).flatMap(([file, patterns]) =>
    existsSync(path.join(client, file))
      ? patterns.filter((pattern) => !pattern.test(read(file))).map((p) => `${file}: no ${p}`)
      : [`${file}: missing`],
  )
  const { stage } = JSON.parse(read("state.json")) as { stage: string }
  const wrongStage = stage === skillCase.stage ? [] : [`state.json: stage ${stage}`]
  const unprovenQuotes =
    skill === "prd" && existsSync(path.join(client, "prd.md"))
      ? quotesNotInTranscript(read("prd.md"), transcripts(client)).map((q) => `unproven "${q}"`)
      : []
  return [...missing, ...wrongStage, ...unprovenQuotes]
}

function transcripts(client: string): string {
  const folder = path.join(client, "interview")
  return readdirSync(folder)
    .map((file) => readFileSync(path.join(folder, file), "utf8"))
    .join("\n")
}

const skill = process.argv[2] ?? ""
if (!Object.hasOwn(CASES, skill)) {
  console.error(`usage: npm run skill-test -- <${Object.keys(CASES).join("|")}>`)
  process.exit(1)
}
const skillCase = CASES[skill]
const workspace = prepareWorkspace(skill, skillCase)
runSkill(skill, skillCase, workspace)
const found = failures(skill, skillCase, workspace)
if (found.length > 0) {
  console.error(`FAIL ${skill} (workspace kept: ${workspace})\n${found.join("\n")}`)
  process.exit(1)
}
rmSync(workspace, { recursive: true })
console.log(
  `PASS ${skill}: ${Object.keys(skillCase.expected).join(", ")}, stage ${skillCase.stage}`,
)
