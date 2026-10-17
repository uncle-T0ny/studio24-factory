import { useEffect, useState } from "react"
import { Field } from "../Field"
import { ImageInput, type ImageInputValue } from "../ImageInput"
import { DraftTextField, NumberField } from "../NumberField"
import { SearchField } from "../SearchField"
import { Slider } from "../Slider"
import { ReadOnlyValue, TextArea, TextField } from "../TextField"
import { ControlSize } from "../types"
import { KIT_IMAGE_ALT, KIT_IMAGE_SRC, KitSection, Specimen } from "./kitShared"

const KIT_IMAGE_ACCEPT = "image/png,image/jpeg"

function ImageInputSpecimen() {
  const [image, setImage] = useState<ImageInputValue | null>(null)

  useEffect(() => {
    if (!image) {
      return
    }

    return () => URL.revokeObjectURL(image.src)
  }, [image])

  return (
    <Specimen label="ImageInput · empty (choose a file) · with an image · busy">
      <Field label="Screenshot (optional)">
        <ImageInput
          image={image}
          accept={KIT_IMAGE_ACCEPT}
          hint="Paste a screenshot with ⌘V, or choose a PNG or JPG."
          onFile={(file) =>
            setImage({
              src: URL.createObjectURL(file),
              alt: KIT_IMAGE_ALT,
              meta: file.name,
            })
          }
          onRemove={() => setImage(null)}
        />
      </Field>
      <ImageInput
        image={{
          src: KIT_IMAGE_SRC,
          alt: KIT_IMAGE_ALT,
          meta: "180 × 180 px · 16 KB",
        }}
        accept={KIT_IMAGE_ACCEPT}
        hint=""
        onFile={() => undefined}
        onRemove={() => undefined}
      />
      <ImageInput
        image={null}
        accept={KIT_IMAGE_ACCEPT}
        hint="Shrinking the image…"
        busy
        onFile={() => undefined}
        onRemove={() => undefined}
      />
    </Specimen>
  )
}

export function InputsSection() {
  const [name, setName] = useState("Spring launch")
  const [rotation, setRotation] = useState(45)
  const [label, setLabel] = useState("Main title")
  const [search, setSearch] = useState("")
  const [filledSearch, setFilledSearch] = useState("spring")
  const [sliderValue, setSliderValue] = useState(60)

  return (
    <KitSection id="inputs">
      <div className="kit-grid">
        <Specimen label="TextField · default, placeholder, sm, lg">
          <TextField
            value={name}
            aria-label="Project name"
            onChange={(event) => setName(event.target.value)}
          />
          <TextField placeholder="Spring launch" aria-label="Placeholder" />
          <TextField size={ControlSize.Small} defaultValue="Small" aria-label="Small" />
          <TextField size={ControlSize.Large} defaultValue="Large" aria-label="Large" />
        </Specimen>
        <Specimen label="TextField · suffix, mono, invalid, disabled, date">
          <TextField defaultValue="16" suffix="px" mono aria-label="Suffix" />
          <TextField defaultValue="not an email" invalid aria-label="Invalid" />
          <TextField defaultValue="Disabled" disabled aria-label="Disabled" />
          <TextField type="date" defaultValue="2027-06-12" aria-label="Date" />
        </Specimen>
        <Specimen label="Field · label, hint, error">
          <Field label="Project name" hint="As it appears on the projects list.">
            <TextField defaultValue="Spring launch" />
          </Field>
          <Field label="Email" error="Couldn't sign in. Check the email and password.">
            <TextField type="email" defaultValue="owner@" />
          </Field>
        </Specimen>
        <Specimen label="TextArea · ReadOnlyValue">
          <Field label="Text">
            <TextArea defaultValue="Kick-off notes" />
          </Field>
          <Field label="Workspace">
            <ReadOnlyValue>Default</ReadOnlyValue>
          </Field>
        </Specimen>
        <Specimen label="Slider · in a Field · disabled">
          <Field label="Zoom">
            <Slider value={sliderValue} min={0} max={100} onChange={setSliderValue} />
          </Field>
          <Slider
            value={30}
            min={0}
            max={100}
            disabled
            aria-label="Disabled slider"
            onChange={() => undefined}
          />
        </Specimen>
        <Specimen label="NumberField · DraftTextField (commit on blur or Enter)">
          <Field label="Rotation">
            <NumberField value={rotation} step={15} suffix="°" onChange={setRotation} />
          </Field>
          <Field label="Label">
            <DraftTextField value={label} onChange={setLabel} />
          </Field>
        </Specimen>
        <Specimen label="SearchField · empty, with text (clear button, Esc clears), sm, disabled">
          <SearchField
            value={search}
            placeholder="Search projects"
            aria-label="Search projects"
            onChange={setSearch}
          />
          <SearchField
            value={filledSearch}
            placeholder="Search projects"
            aria-label="Search with text"
            onChange={setFilledSearch}
          />
          <SearchField
            value=""
            size={ControlSize.Small}
            placeholder="Small"
            aria-label="Small search"
            onChange={() => undefined}
          />
          <SearchField
            value="bar"
            disabled
            aria-label="Disabled search"
            onChange={() => undefined}
          />
        </Specimen>
        <ImageInputSpecimen />
      </div>
    </KitSection>
  )
}
