import { Migrations } from "@convex-dev/migrations"
import { components } from "./_generated/api"
import schema from "./schema"

// Schema changes on real data go through a migration. Define each one here, deploy it, then run it:
//   npx convex run migrations:run '{fn: "migrations:trimProjectNames"}'          (dev)
//   npx convex run migrations:run '{fn: "migrations:trimProjectNames"}' --prod   (prod)
// `npx convex run --component migrations lib:getStatus --watch` follows its progress.
export const migrations = new Migrations(components.migrations, { schema })

export const run = migrations.runner()

// The example: trims the whitespace around project names saved before create() trimmed them.
// Running it again changes nothing.
export const trimProjectNames = migrations.define({
  table: "projects",
  migrateOne: (_ctx, project) => {
    const name = project.name.trim()

    return name === project.name ? undefined : { name }
  },
})
