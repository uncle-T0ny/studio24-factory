// The system clipboard, or undefined outside a secure context (plain http on a LAN address), where
// browsers leave navigator.clipboard out although the DOM types say it is always there.
export function systemClipboard(): Clipboard | undefined {
  return (navigator as Partial<Navigator>).clipboard
}
