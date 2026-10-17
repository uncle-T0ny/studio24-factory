const SHARE_TOKEN_BYTES = 24

export function newShareToken(): string {
  const bytes = new Uint8Array(SHARE_TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  const binary = String.fromCharCode(...bytes)

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
