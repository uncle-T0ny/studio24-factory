import { FIXTURE_TRANSCRIPT } from "./fixtureTranscript"
import { SEEDED_TEMPLATE } from "./seededTemplate"
import { clientTurnCount } from "./transcript"

// The answers askLlm returns without OPENROUTER_API_KEY, one per task, made on the fixture
// transcript. The tests mock the model with the same answers. NFR-2's quote is a paraphrase on
// purpose: quote verification marks it unverified.

const prd = {
  summary:
    "A seating and floor plan app for an event planner: draw each venue's room, import the guest list, drag guests onto tables under seating rules, share a view-only plan with the couple and a printable one with the venue staff.",
  requirements: [
    {
      code: "FR-1",
      kind: "FR",
      title: "Draw the room",
      detail:
        "The planner draws a venue's floor plan: round and long tables, the dance floor and the stage, and sets the chairs per table.",
      priority: "must",
      quotes: [
        {
          turn: 6,
          text: "I need to draw the room: round and long tables, the dance floor, the stage",
        },
      ],
    },
    {
      code: "FR-2",
      kind: "FR",
      title: "Import the guest list",
      detail: "The planner imports guests from a CSV file with name, party and meal choice.",
      priority: "must",
      quotes: [{ turn: 4, text: "I'd like to import a CSV with names, party and meal choice" }],
    },
    {
      code: "FR-3",
      kind: "FR",
      title: "Seat guests by drag and drop",
      detail: "The planner drags guests onto tables; guests without a seat are always listed.",
      priority: "must",
      quotes: [
        {
          turn: 2,
          text: "I want to drag guests onto tables on a floor plan and see at once who still has no seat",
        },
      ],
    },
    {
      code: "FR-4",
      kind: "FR",
      title: "Seating rules",
      detail:
        "The planner marks guests who must sit together or never share a table; a seat that breaks a rule shows a warning.",
      priority: "should",
      quotes: [{ turn: 10, text: "The app should warn me when a seat breaks one of those rules" }],
    },
    {
      code: "FR-5",
      kind: "FR",
      title: "The couple's view link",
      detail:
        "The couple opens the plan by a link, read-only, and can suggest swaps; only the planner edits.",
      priority: "should",
      quotes: [
        {
          turn: 8,
          text: "The couple should get a link to view the plan and suggest swaps, but only I can change it",
        },
      ],
    },
    {
      code: "FR-6",
      kind: "FR",
      title: "Printable plan",
      detail: "A printable plan with table numbers for the venue staff.",
      priority: "must",
      quotes: [{ turn: 8, text: "The venue staff need a printable version with table numbers" }],
    },
    {
      code: "NFR-1",
      kind: "NFR",
      title: "Works on a tablet",
      detail: "Every screen, the floor plan included, works by touch on a tablet.",
      priority: "must",
      quotes: [{ turn: 12, text: "It has to work on my tablet at the venue" }],
    },
    {
      code: "NFR-2",
      kind: "NFR",
      title: "Works when the wifi drops",
      detail: "The plan stays usable at the venue without a connection.",
      priority: "should",
      quotes: [{ turn: 12, text: "it must keep working offline at the venue" }],
    },
    {
      code: "NFR-3",
      kind: "NFR",
      title: "Event size",
      detail: "About four events a month, up to three hundred guests each.",
      priority: "must",
      quotes: [{ turn: 12, text: "About four events a month, up to three hundred guests each" }],
    },
  ],
  outOfScope: ["Payments", "Invitations and RSVPs", "Meal counts per table (later)"],
  decisions: [
    "Only the planner edits the plan; the couple views it and suggests swaps.",
    "Payments, invitations and RSVPs stay in the planner's existing tools.",
  ],
}

const analysis = {
  verdicts: [
    {
      code: "FR-1",
      verdict: "extension",
      hours: 14,
      infraMonthlyUsd: 0,
      rationale:
        "No canvas in the template; a floor plan editor is a new React component storing tables as Convex documents.",
    },
    {
      code: "FR-2",
      verdict: "extension",
      hours: 4,
      infraMonthlyUsd: 0,
      rationale:
        "Parse the CSV in the browser and insert the guests with one mutation, like the template's import.",
    },
    {
      code: "FR-3",
      verdict: "extension",
      hours: 8,
      infraMonthlyUsd: 0,
      rationale:
        "Drag and drop on the floor plan; the unseated guests are one Convex query, live for free.",
    },
    {
      code: "FR-4",
      verdict: "extension",
      hours: 6,
      infraMonthlyUsd: 0,
      rationale:
        "Rules are documents; a pure function checks a plan and the editor shows its warnings.",
    },
    {
      code: "FR-5",
      verdict: "inTemplate",
      hours: 3,
      infraMonthlyUsd: 0,
      rationale:
        "The template's share token already opens one project to a guest; suggestions are one small table.",
    },
    {
      code: "FR-6",
      verdict: "extension",
      hours: 3,
      infraMonthlyUsd: 0,
      rationale: "A print stylesheet on the plan view.",
    },
    {
      code: "NFR-1",
      verdict: "inTemplate",
      hours: 2,
      infraMonthlyUsd: 0,
      rationale: "The UI kit is responsive; the editor needs touch-sized handles.",
    },
    {
      code: "NFR-2",
      verdict: "notSupported",
      hours: 6,
      infraMonthlyUsd: 0,
      alternative:
        "Keep the last loaded plan readable offline (a cached print view) and edit only when connected; offline editing would need a sync engine the template doesn't have.",
      rationale: "Convex needs a live connection to read and write.",
    },
    {
      code: "NFR-3",
      verdict: "inTemplate",
      hours: 0,
      infraMonthlyUsd: 0,
      rationale: "About 1,200 guests a month is far inside Convex's free plan.",
    },
  ],
  assumptions: [
    "4 events a month, 300 guests each",
    "3 people have a plan open while it is edited",
    "About 6,000 Convex function calls per event",
  ],
  freeTierBreaks: [
    {
      service: "Convex",
      limit: "1,000,000 function calls a month",
      atUsage: "About 170 events a month",
      extraUsd: 2.2,
      reason:
        "Each seat change re-runs the plan's live queries for everyone who has it open. The Free plan stops at its calls; Convex Starter bills $2.20 per extra million.",
    },
  ],
}

const feedbackSplit = {
  items: [
    { kind: "works", text: "Dragging a guest onto a table is quick." },
    { kind: "broken", text: "The printable plan cuts off the last row of tables." },
    { kind: "request", text: "Show each table's free chairs on the floor plan." },
  ],
}

const interviewLines = FIXTURE_TRANSCRIPT.filter((turn) => turn.speaker === "agent").map(
  (turn) => turn.text,
)

// The fixture's questions in order, one per client answer so far, then its closing line.
function interviewTurn(data: string) {
  const answered = Math.min(clientTurnCount(data), interviewLines.length - 1)

  return { question: interviewLines[answered], done: answered === interviewLines.length - 1 }
}

export const RECORDED_ANSWERS = {
  prd: () => prd,
  manifest: () => SEEDED_TEMPLATE.manifest,
  analysis: () => analysis,
  feedbackSplit: () => feedbackSplit,
  interviewTurn,
}
