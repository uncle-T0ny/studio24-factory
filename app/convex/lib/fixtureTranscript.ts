// A made-up interview: an event planner asks for a seating and floor plan app. The recorded
// answers (recordedAnswers.ts) and the tests are made on it.

export interface FixtureTurn {
  seq: number
  speaker: "agent" | "client"
  text: string
}

export const FIXTURE_TRANSCRIPT: FixtureTurn[] = [
  { seq: 1, speaker: "agent", text: "Thanks for joining. What should the app do for your events?" },
  {
    seq: 2,
    speaker: "client",
    text: "I plan weddings and company dinners, and the seating chart eats my week. I want to drag guests onto tables on a floor plan and see at once who still has no seat.",
  },
  { seq: 3, speaker: "agent", text: "How do you get the guest list today?" },
  {
    seq: 4,
    speaker: "client",
    text: "Couples send me a spreadsheet. I'd like to import a CSV with names, party and meal choice instead of typing it all in.",
  },
  { seq: 5, speaker: "agent", text: "What about the room itself?" },
  {
    seq: 6,
    speaker: "client",
    text: "Every venue is different, so I need to draw the room: round and long tables, the dance floor, the stage, and how many chairs each table has.",
  },
  { seq: 7, speaker: "agent", text: "Who else needs to see the plan?" },
  {
    seq: 8,
    speaker: "client",
    text: "The couple should get a link to view the plan and suggest swaps, but only I can change it. The venue staff need a printable version with table numbers.",
  },
  { seq: 9, speaker: "agent", text: "Are there rules about who sits where?" },
  {
    seq: 10,
    speaker: "client",
    text: "Some guests must sit together and some must never share a table. The app should warn me when a seat breaks one of those rules.",
  },
  { seq: 11, speaker: "agent", text: "How many events and guests are we talking about?" },
  {
    seq: 12,
    speaker: "client",
    text: "About four events a month, up to three hundred guests each. It has to work on my tablet at the venue, even when the wifi drops.",
  },
  { seq: 13, speaker: "agent", text: "Anything you don't need in the first version?" },
  {
    seq: 14,
    speaker: "client",
    text: "No payments and no invitations or RSVPs, I already have tools for those. Meal counts per table would be nice later, not now.",
  },
  { seq: 15, speaker: "agent", text: "Thanks, that's everything I need for a first draft." },
]
