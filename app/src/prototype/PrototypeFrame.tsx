import type { FunctionReturnType } from "convex/server"
import type { api } from "../../convex/_generated/api"
import { Text, TextTone } from "../ui"
import "./prototype.css"

export type Prototype = FunctionReturnType<typeof api.prototypes.forClient>

export function PrototypeFrame({ prototype }: { prototype: Prototype }) {
  if (prototype === null) {
    return <Text tone={TextTone.Muted}>There is no prototype to look at yet.</Text>
  }

  return (
    <section className="prototype" aria-label="Prototype">
      <a
        className="ui-text-link prototype-link"
        href={prototype.url}
        target="_blank"
        rel="noreferrer"
      >
        Open the prototype in a new tab
      </a>
      <iframe
        className="prototype-frame"
        title="The prototype"
        src={prototype.url}
        // A mockup runs in an opaque origin; a dev app needs its own origin for its sign-in.
        sandbox={prototype.kind === "mockup" ? "allow-scripts" : undefined}
      />
    </section>
  )
}
