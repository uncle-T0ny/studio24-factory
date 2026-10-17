import { useMutation, useQuery } from "convex/react"
import { lazy, Suspense } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Card, CardHeader, Heading, HeadingLevel, Text, TextSize, TextTone } from "../ui"
import { TypedFallback } from "../voice/TypedFallback"

// LiveKit's client is large, so the voice card loads only where voice is on.
const ProjectVoice = lazy(() => import("./ProjectVoice"))

export interface ProjectAssistantProps {
  projectId: Id<"projects">
  // A guest's token from the share link; the owner has none.
  shareToken?: string
}

// The project page's input, for the owner or a guest. voice.enabled says whether the deployment
// has the voice keys (convex/lib/voice.ts): on, the voice card with its mic; off, no mic and no
// voice entry point, only a typed message, saved with the project.
export function ProjectAssistant({ projectId, shareToken }: ProjectAssistantProps) {
  const isVoiceEnabled = useQuery(api.voice.enabled, {})
  const saveTypedMessage = useMutation(api.voice.saveTypedMessage)

  if (isVoiceEnabled === undefined) {
    return null
  }

  if (isVoiceEnabled) {
    return (
      <Suspense fallback={null}>
        <ProjectVoice projectId={projectId} shareToken={shareToken} />
      </Suspense>
    )
  }

  return (
    <Card label="Message">
      <CardHeader>
        <Heading level={HeadingLevel.Section}>Message</Heading>
      </CardHeader>
      <Text tone={TextTone.Muted} size={TextSize.Small}>
        Write what you need. The message is saved with the project.
      </Text>
      <TypedFallback
        label="Type a message"
        onSend={async (text) => {
          await saveTypedMessage({ projectId, text, shareToken })
        }}
      />
    </Card>
  )
}
