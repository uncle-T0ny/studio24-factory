// The keyboard's platform, for shortcut labels (⌘ on a Mac, Ctrl elsewhere), and whether a key
// press belongs to a text control rather than to a page-wide shortcut or paste handler.
export enum Platform {
  Mac = "mac",
  Other = "other",
}

export function platformOf(platformName: string): Platform {
  return /mac|iphone|ipad/i.test(platformName) ? Platform.Mac : Platform.Other
}

export function currentPlatform(): Platform {
  const navigatorWithData = navigator as Navigator & {
    userAgentData?: {
      platform: string
    }
  }
  // userAgentData is Chromium only; elsewhere the user agent names the platform too ("Macintosh",
  // "iPhone", "Windows"), which replaces the deprecated navigator.platform.
  const platformName = navigatorWithData.userAgentData?.platform ?? navigator.userAgent

  return platformOf(platformName)
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}
