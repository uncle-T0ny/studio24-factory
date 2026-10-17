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
  const platformName = navigatorWithData.userAgentData?.platform ?? navigator.userAgent

  return platformOf(platformName)
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}
