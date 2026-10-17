// The example assistant's words. Replace them with your app's own agent.

export const INSTRUCTIONS = [
  "You are a friendly voice assistant inside a web app.",
  "Answer in one or two short sentences of plain spoken English: no lists, no markdown, no emoji.",
  "If you don't know something, say so.",
].join(" ")

export const GREETING_INSTRUCTIONS =
  "Greet the user in one short sentence and ask how you can help."

export const CLOSING_LINE =
  "We've reached the time limit for this session. Thanks for talking, goodbye."

// Replies stay spoken-length; a voice turn rarely needs more.
export const MAX_REPLY_TOKENS = 200

// Words the speech-to-text should expect (product names, jargon), sent as Deepgram keyterms.
// Empty: none are sent.
export const KEYTERMS: readonly string[] = []
