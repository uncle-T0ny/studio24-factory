const EMAIL = /[\w.%+-]+@[\w-]+(\.[\w-]+)*\.[a-z]{2,}/i

interface PrivacyFinding {
  line: number
  kind: "an email address" | "a deny-listed name"
}

export function parseDenyList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Unicode-aware word edges, since \b only knows ASCII and names may be Cyrillic.
function namePattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "iu")
}

export function findPrivateData(text: string, deniedNames: readonly string[]): PrivacyFinding[] {
  const names = deniedNames.map(namePattern)

  return text.split("\n").flatMap((content, index) => {
    const line = index + 1
    const findings: PrivacyFinding[] = []

    if (EMAIL.test(content)) {
      findings.push({ line, kind: "an email address" })
    }

    if (names.some((name) => name.test(content))) {
      findings.push({ line, kind: "a deny-listed name" })
    }

    return findings
  })
}
