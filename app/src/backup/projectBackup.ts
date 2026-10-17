import type { BackupAdapter } from "./adapter"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { parseProjectBackup } from "../../convex/lib/backup"
import type { ProjectContent } from "../../convex/lib/validators"

export const projectBackup: BackupAdapter<ProjectContent, Id<"projects">> = {
  read: async (convex, projectId) => await convex.query(api.backup.exportProject, { projectId }),
  parse: (text) => parseProjectBackup(text).data,
  write: async (convex, content) => await convex.mutation(api.backup.importProject, content),
  title: (content) => content.project.name,
}
