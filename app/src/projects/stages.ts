import { STAGES, type Stage } from "../../convex/lib/validators"

export const STAGE_LABELS: Record<Stage, string> = {
  interview: "Interview",
  prd: "PRD",
  analysis: "Template analysis",
  prototype: "Prototype",
  feedback: "Feedback",
  final: "Final app",
  transferred: "Transferred",
}

export const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] }))

export function nextStage(stage: Stage): Stage | null {
  return STAGES[STAGES.indexOf(stage) + 1] ?? null
}
