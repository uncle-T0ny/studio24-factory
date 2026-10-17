// Outside a secure context browsers omit navigator.clipboard, although the DOM types say it is there.
export function systemClipboard(): Clipboard | undefined {
  return (navigator as Partial<Navigator>).clipboard
}
