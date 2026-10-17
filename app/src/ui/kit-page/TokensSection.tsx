import { Button } from "../Button"
import { Text, TextSize, TextTone } from "../Text"
import { KitSection, Specimen, Row } from "./kitShared"

const COLOR_TOKENS: Record<string, string> = {
  "--paper": "Page background",
  "--surface": "Cards, inputs, buttons",
  "--panel": "Side panels, top bar",
  "--canvas": "Canvas, work area",
  "--ink": "Text, outlines",
  "--ink-2": "Secondary text, icons",
  "--muted": "Labels, hints",
  "--line": "Borders, dividers",
  "--grid": "Canvas grid",
  "--accent": "Primary action, selection",
  "--accent-ink": "Text on accent",
  "--accent-soft": "Selected segment, accent fill",
  "--amber": "Warning, changed by a guest",
  "--amber-ink": "Text on warning fill",
  "--amber-soft": "Warning fill",
  "--danger": "Delete, errors",
  "--danger-soft": "Error fill",
}

interface FontSample {
  family: string
  weights: number[]
  sample: string
}

const FONT_SAMPLES: Record<string, FontSample> = {
  "System sans 600 · display: names, page titles": {
    family: "--font-display",
    weights: [600],
    sample: "Spring launch",
  },
  "System sans 400 / 500 / 600 · UI and labels": {
    family: "--font-body",
    weights: [400, 500, 600],
    sample: "Spring launch · 8 tasks",
  },
  "System mono 400 / 500 · tabular data only": {
    family: "--font-mono",
    weights: [400, 500],
    sample: "1440 × 900 · 8 → 7",
  },
}

const DISPLAY_TOKEN = "--text-display"

const TYPE_SAMPLES: Record<string, string> = {
  "--text-display": "Starter App",
  "--text-xl": "Spring launch",
  "--text-lg": "New project",
  "--text-md": "Body text, buttons and inputs",
  "--text-sm": "Field labels, hints, segments",
  "--text-xs": "Badges, eyebrow, scale bar",
  "--text-2xs": "SECTION LABEL",
}

const SPACE_TOKENS = [
  "--space-half",
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-7",
  "--space-8",
  "--space-10",
  "--space-16",
]

const RADIUS_TOKENS = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-pill"]

const CONTROL_TOKENS = ["--control-sm", "--control-md", "--control-lg"]

export function TokensSection() {
  return (
    <KitSection id="tokens">
      <Specimen label="Colours (tokens.css; light and dark follow the theme switch above)">
        <div className="kit-grid">
          {Object.entries(COLOR_TOKENS).map(([token, use]) => (
            <div key={token} className="kit-swatch">
              <span className="kit-swatch-chip" style={{ background: `var(${token})` }} />
              <span className="kit-swatch-text">
                <Text inline mono size={TextSize.Small}>
                  {token}
                </Text>
                <Text inline tone={TextTone.Muted} size={TextSize.ExtraSmall}>
                  {use}
                </Text>
              </span>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen label="Font families (system stacks in tokens.css)">
        {Object.entries(FONT_SAMPLES).map(([description, font]) => (
          <div key={font.family} className="kit-type-row">
            <span className="kit-swatch-text">
              <Text inline mono size={TextSize.Small}>
                {font.family}
              </Text>
              <Text inline tone={TextTone.Muted} size={TextSize.ExtraSmall}>
                {description}
              </Text>
            </span>
            <span className="kit-font-samples">
              {font.weights.map((weight) => (
                <span
                  key={weight}
                  style={{
                    fontFamily: `var(${font.family})`,
                    fontWeight: weight,
                    fontSize: font.family === "--font-display" ? "2rem" : "var(--text-lg)",
                  }}
                >
                  {font.sample} · {weight}
                </span>
              ))}
            </span>
          </div>
        ))}
      </Specimen>
      <Specimen label="Type scale (sizes)">
        {Object.entries(TYPE_SAMPLES).map(([token, sample]) => (
          <div key={token} className="kit-type-row">
            <Text inline mono size={TextSize.Small} tone={TextTone.Muted}>
              {token}
            </Text>
            <span
              className={token === DISPLAY_TOKEN ? "kit-type-sample--display" : undefined}
              style={{ fontSize: `var(${token})` }}
            >
              {sample}
            </span>
          </div>
        ))}
      </Specimen>
      <div className="kit-grid kit-grid--wide">
        <Specimen label="Spacing">
          {SPACE_TOKENS.map((token) => (
            <div key={token} className="kit-space-row">
              <Text inline mono size={TextSize.Small} tone={TextTone.Muted}>
                {token}
              </Text>
              <span className="kit-space-bar" style={{ width: `var(${token})` }} />
            </div>
          ))}
        </Specimen>
        <Specimen label="Radius, control heights, focus ring">
          <Row>
            {RADIUS_TOKENS.map((token) => (
              <span
                key={token}
                className="kit-radius-box"
                title={token}
                style={{ borderRadius: `var(${token})` }}
              />
            ))}
          </Row>
          <Text mono size={TextSize.ExtraSmall} tone={TextTone.Muted}>
            {RADIUS_TOKENS.join(" · ")}
          </Text>
          <Row>
            {CONTROL_TOKENS.map((token) => (
              <span
                key={token}
                className="kit-radius-box"
                title={token}
                style={{
                  width: `var(${token})`,
                  height: `var(${token})`,
                }}
              />
            ))}
          </Row>
          <Text mono size={TextSize.ExtraSmall} tone={TextTone.Muted}>
            {CONTROL_TOKENS.join(" · ")}
          </Text>
          <Row>
            <span className="kit-focus-sample">
              <Button>Focused</Button>
            </span>
          </Row>
          <Text mono size={TextSize.ExtraSmall} tone={TextTone.Muted}>
            --focus-ring-color · --focus-ring-width · --focus-ring-offset · --shadow-overlay
          </Text>
        </Specimen>
      </div>
    </KitSection>
  )
}
