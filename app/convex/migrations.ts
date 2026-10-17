import { Migrations } from "@convex-dev/migrations"
import { components } from "./_generated/api"
import schema from "./schema"

export const migrations = new Migrations(components.migrations, { schema })

export const run = migrations.runner()

export const trimProjectNames = migrations.define({
  table: "projects",
  migrateOne: (_ctx, project) => {
    const name = project.name.trim()

    return name === project.name ? undefined : { name }
  },
})
