import { type Ask, askLlm } from "./llm"
import { internal } from "../_generated/api"
import { type ActionCtx } from "../_generated/server"

export function askCounted(ctx: ActionCtx): Ask {
  const countCall = async () => {
    await ctx.runMutation(internal.usage.spend, { kind: "llmCalls" })
  }
  return (request) => askLlm(request, countCall)
}
