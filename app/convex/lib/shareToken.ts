const SHARE_TOKEN_BYTES = 24

export function newShareToken(): string {
  const bytes = new Uint8Array(SHARE_TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  const binary = String.fromCharCode(...bytes)

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
