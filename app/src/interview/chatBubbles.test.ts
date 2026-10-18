import { describe, expect, it } from "vitest"
import { chatBubbles, type ChatLine } from "./ChatTranscript"

function line(key: string, speaker: ChatLine["speaker"], text: string): ChatLine {
  return { key, speaker, label: speaker === "agent" ? "Interviewer" : "You", text }
}

describe("chatBubbles", () => {
  it("joins a speaker's consecutive pieces into one bubble and keeps a restart's longer text", () => {
    const bubbles = chatBubbles([
      line("1", "client", "She said"),
      line("2", "client", "she's a wedding planner,"),
      line("3", "client", "to build the floor plans."),
      line("4", "agent", "Sorry,"),
      line("5", "agent", "Sorry, I think the speech came through garbled."),
      line("6", "agent", "  "),
      line("7", "client", "Floor plans."),
    ])

    expect(bubbles.map(({ key, speaker, text }) => [key, speaker, text])).toEqual([
      ["1", "client", "She said she's a wedding planner, to build the floor plans."],
      ["4", "agent", "Sorry, I think the speech came through garbled."],
      ["7", "client", "Floor plans."],
    ])
  })
})
