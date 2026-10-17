import { assertLocalDeployment, runFunction } from "./start/deployment.ts"
import { demoLinkLine, type DemoLink } from "./start/settings.ts"

assertLocalDeployment()

const link = (await runFunction("seed:reseed")) as DemoLink

console.log(`[reseed] the demo client is back at an empty interview: ${demoLinkLine(link)}`)
