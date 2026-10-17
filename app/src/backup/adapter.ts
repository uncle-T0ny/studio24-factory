import type { ConvexReactClient } from "convex/react"

// What export and import need to know about one kind of resource. ExportButton and ImportCard
// work over any adapter; projectBackup.ts is the one for the example resource. A resource with
// files downloads them in `read` (as data URLs, see dataUrl.ts) and uploads them in `write`.
export interface BackupAdapter<Content, ResourceId> {
  // The resource's content, as the export file carries it.
  read: (convex: ConvexReactClient, id: ResourceId) => Promise<Content>
  // The content of an export file's text, checked; throws a sentence for the user.
  parse: (text: string) => Content
  // Makes a new resource from the content and returns its id.
  write: (convex: ConvexReactClient, content: Content) => Promise<ResourceId>
  // The name people know the resource by, for the file name and the "Imported" note.
  title: (content: Content) => string
}
