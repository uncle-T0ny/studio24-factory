import type { ConvexReactClient } from "convex/react"

export interface BackupAdapter<Content, ResourceId> {
  read: (convex: ConvexReactClient, id: ResourceId) => Promise<Content>
  parse: (text: string) => Content
  write: (convex: ConvexReactClient, content: Content) => Promise<ResourceId>
  title: (content: Content) => string
}
