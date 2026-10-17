import { systemClipboard } from "../lib/clipboard"

// The share link's path is /p/<token> (App.tsx routes it to the share-link page).
export function shareLinkOf(origin: string, shareToken: string): string {
  const base = origin.replace(/\/+$/, "")

  return `${base}/p/${encodeURIComponent(shareToken)}`
}

export async function copyText(text: string): Promise<void> {
  const clipboard = systemClipboard()

  if (!clipboard) {
    throw new Error("The clipboard isn't available here")
  }

  await clipboard.writeText(text)
}
