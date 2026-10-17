import { useEffect, useState } from "react"
import { SegmentedControl } from "./SegmentedControl"
import { Eyebrow, Heading, HeadingLevel, Text, TextTone } from "./Text"
import { ButtonsSection } from "./kit-page/ButtonsSection"
import { ChoicesSection } from "./kit-page/ChoicesSection"
import { ChromeSection } from "./kit-page/ChromeSection"
import { InputsSection } from "./kit-page/InputsSection"
import { ListsSection } from "./kit-page/ListsSection"
import { OverlaysSection } from "./kit-page/OverlaysSection"
import { PagesSection } from "./kit-page/PagesSection"
import { StatusSection } from "./kit-page/StatusSection"
import { TokensSection } from "./kit-page/TokensSection"
import { SECTIONS } from "./kit-page/kitShared"
import type { Option } from "./types"
import "./UiKitPage.css"

enum ThemeChoice {
  System = "system",
  Light = "light",
  Dark = "dark",
}

const THEME_OPTIONS: Option<ThemeChoice>[] = [
  {
    value: ThemeChoice.System,
    label: "System",
  },
  {
    value: ThemeChoice.Light,
    label: "Light",
  },
  {
    value: ThemeChoice.Dark,
    label: "Dark",
  },
]

function useThemeChoice(theme: ThemeChoice) {
  useEffect(() => {
    const root = document.documentElement

    if (theme === ThemeChoice.System) {
      delete root.dataset.theme
    } else {
      root.dataset.theme = theme
    }

    return () => {
      delete root.dataset.theme
    }
  }, [theme])
}

export default function UiKitPage() {
  const [theme, setTheme] = useState(ThemeChoice.System)

  useThemeChoice(theme)

  return (
    <div className="kit-page">
      <header className="kit-header">
        <div className="kit-header-titles">
          <Eyebrow>Design system</Eyebrow>
          <Heading level={HeadingLevel.Display}>UI kit</Heading>
          <Text tone={TextTone.Muted}>
            Every component in app/src/ui, in its states. Import from app/src/ui; use tokens only.
          </Text>
        </div>
        <SegmentedControl label="Theme" value={theme} options={THEME_OPTIONS} onChange={setTheme} />
      </header>
      <nav aria-label="Sections">
        <ul className="kit-nav">
          {Object.entries(SECTIONS).map(([id, title]) => (
            <li key={id}>
              <a href={`#${id}`}>{title}</a>
            </li>
          ))}
        </ul>
      </nav>
      <TokensSection />
      <ButtonsSection />
      <InputsSection />
      <ChoicesSection />
      <StatusSection />
      <OverlaysSection />
      <ChromeSection />
      <ListsSection />
      <PagesSection />
    </div>
  )
}
