import { Circle, Plus } from "lucide-react"
import { Button, ButtonVariant } from "../Button"
import { EmptyState } from "../EmptyState"
import { List, ListButton, ListButtonTone, ListRow } from "../List"
import { MetaList } from "../MetaList"
import { Thumbnail } from "../Thumbnail"
import { Toolbar } from "../TopBar"
import { ControlSize } from "../types"
import { PAGE_PATH, KIT_IMAGE_ALT, KIT_IMAGE_SRC, KitSection, Specimen } from "./kitShared"

const KIT_CONTEXT = [
  { label: "Page", value: "/project/k17…" },
  { label: "Browser", value: "Chrome 141 on macOS" },
  { label: "Window", value: "1440 × 900" },
  { label: "Version", value: "a680093" },
]

export function ListsSection() {
  return (
    <KitSection id="lists">
      <div className="kit-grid kit-grid--wide">
        <Specimen label="List · ListRow with link, meta and actions · without link">
          <List label="Projects">
            <ListRow
              to={PAGE_PATH}
              title="Spring launch"
              meta="Jun 12, 2027"
              actions={<Button variant={ButtonVariant.Danger}>Delete</Button>}
            />
            <ListRow title="Autumn review" meta="12 tasks" />
          </List>
        </Specimen>
        <Specimen label="ListButton · icon · accent · meta · disabled">
          <ListButton icon={<Circle size={16} />}>Blank project</ListButton>
          <ListButton tone={ListButtonTone.Accent} icon={<Plus size={16} />}>
            New template
          </ListButton>
          <ListButton meta="3 fields">Contact form</ListButton>
          <ListButton disabled icon={<Circle size={16} />}>
            Disabled
          </ListButton>
          <ListButton tone={ListButtonTone.Accent} icon={<Plus size={16} />} disabled>
            Save as template (disabled)
          </ListButton>
        </Specimen>
        <Specimen label="Thumbnail · click to enlarge (a wide Dialog; Escape or the backdrop closes)">
          <Thumbnail src={KIT_IMAGE_SRC} alt={KIT_IMAGE_ALT} />
        </Specimen>
        <Specimen label="MetaList · label and value pairs in small text (what feedback was sent with)">
          <MetaList label="Sent with" entries={KIT_CONTEXT} />
        </Specimen>
        <Specimen label="EmptyState · with an action in a Toolbar (a search with no match)">
          <EmptyState>No projects yet.</EmptyState>
          <Toolbar wrap>
            <EmptyState>No projects match</EmptyState>
            <Button variant={ButtonVariant.Link} size={ControlSize.Small}>
              Clear
            </Button>
          </Toolbar>
        </Specimen>
      </div>
    </KitSection>
  )
}
