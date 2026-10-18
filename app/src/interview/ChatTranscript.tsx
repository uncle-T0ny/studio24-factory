import "./interview.css"

export interface ChatLine {
  key: string
  speaker: "agent" | "client"
  label: string
  text: string
}

// Speech arrives in pieces, and a restart after an interruption repeats its start: one bubble per
// run of a speaker. Only the display merges; stored turns stay verbatim for the PRD's quotes.
export function chatBubbles(lines: readonly ChatLine[]): ChatLine[] {
  const bubbles: ChatLine[] = []

  for (const line of lines) {
    const text = line.text.trim()
    const last = bubbles.at(-1)

    if (last?.speaker !== line.speaker) {
      bubbles.push({ ...line, text })
    } else if (text.startsWith(last.text)) {
      last.text = text
    } else if (!last.text.startsWith(text)) {
      last.text = `${last.text} ${text}`
    }
  }

  return bubbles.filter((bubble) => bubble.text)
}

export function ChatTranscript({ label, lines }: { label: string; lines: readonly ChatLine[] }) {
  return (
    <ol className="interview-chat" aria-label={label}>
      {chatBubbles(lines).map((bubble) => (
        <li key={bubble.key} className={`interview-turn interview-turn--${bubble.speaker}`}>
          <span className="interview-speaker">{bubble.label}</span>
          <p className="interview-bubble">{bubble.text}</p>
        </li>
      ))}
    </ol>
  )
}
