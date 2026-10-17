import { parseArgs } from "node:util"
import { validate } from "convex-helpers/validators"
import { convexRun, DEPLOYMENT_OPTIONS, errorText, type DeploymentChoice } from "./lib/convex"
import {
  browserSummary,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TYPE_LABELS,
  feedbackEntriesValidator,
  formatSenderTime,
  type FeedbackEntry,
} from "../convex/lib/feedback"

// Prints the feedback for triage by Claude, as Markdown:
//   npm run feedback -- [--prod] [--all]
// New entries only, newest first; --all adds the done ones. It reads the deployment that
// `npx convex run` reads: .env.local's, production with --prod, or --deployment <name>. It prints
// only the entries (type, message, context, a screenshot URL), never an environment variable,
// key or token.

interface Options {
  deployment: DeploymentChoice
  includeDone: boolean
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      ...DEPLOYMENT_OPTIONS,
      all: { type: "boolean", default: false },
    },
  })

  return {
    deployment: values,
    includeDone: values.all,
  }
}

function listForTriage(options: Options): FeedbackEntry[] {
  const entries = convexRun(
    "feedback:listForTriage",
    { includeDone: options.includeDone },
    options.deployment,
  )

  if (!validate(feedbackEntriesValidator, entries)) {
    throw new Error("feedback:listForTriage returned something unexpected.")
  }

  return entries
}

function quote(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.length > 0 ? `> ${line}` : ">"))
    .join("\n")
}

function entryMarkdown(entry: FeedbackEntry, index: number): string {
  const context = entry.context
  const lines = [
    `## ${index + 1}. ${FEEDBACK_TYPE_LABELS[entry.type]} · ${new Date(entry.createdAt).toISOString()} · ${FEEDBACK_STATUS_LABELS[entry.status]}`,
    "",
    quote(entry.message),
    "",
    `- From: ${entry.authorEmail ?? "unknown"}`,
    `- Page: \`${context.path}\``,
  ]

  if (context.projectId) {
    lines.push(`- Project: \`${context.projectId}\``)
  }

  lines.push(
    `- App version: \`${context.appVersion}\``,
    `- Browser: ${browserSummary(context.userAgent)} (\`${context.userAgent}\`)`,
    `- Window: ${context.viewport.width} × ${context.viewport.height}`,
    `- Their time: ${formatSenderTime(context)}`,
    `- Screenshot: ${entry.screenshotUrl ?? "none"}`,
    `- ID: \`${entry.id}\``,
  )

  return lines.join("\n")
}

function reportMarkdown(entries: FeedbackEntry[], options: Options): string {
  const where = options.deployment.prod
    ? "prod"
    : (options.deployment.deployment ?? "the .env.local deployment")
  const noun = entries.length === 1 ? "entry" : "entries"
  const which = options.includeDone ? noun : `new ${noun}`
  const heading = `# Feedback: ${entries.length} ${which} (${where})`

  if (entries.length === 0) {
    return `${heading}\n\nNothing to triage.`
  }

  return [heading, ...entries.map(entryMarkdown)].join("\n\n")
}

function main() {
  const options = readOptions()

  console.log(reportMarkdown(listForTriage(options), options))
}

try {
  main()
} catch (error: unknown) {
  console.error(errorText(error))
  process.exit(1)
}
