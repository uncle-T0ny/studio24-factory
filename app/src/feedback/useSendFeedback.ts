import { useMutation } from "convex/react"
import { useCallback } from "react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { FeedbackContext, FeedbackType } from "../../convex/lib/feedback"
import { uploadFile } from "../lib/upload"

export interface FeedbackDraft {
  type: FeedbackType
  message: string
  screenshot: Blob | null
  context: FeedbackContext
}

const UPLOAD_FAILED = "The screenshot didn't upload. Try again."

// Uploads the screenshot to Convex storage, if there is one, then saves the entry.
export function useSendFeedback(): (draft: FeedbackDraft) => Promise<Id<"feedback">> {
  const generateUploadUrl = useMutation(api.feedback.generateUploadUrl)
  const create = useMutation(api.feedback.create)

  return useCallback(
    async (draft: FeedbackDraft) => {
      let screenshotId: Id<"_storage"> | undefined

      if (draft.screenshot) {
        const uploadUrl = await generateUploadUrl()

        screenshotId = await uploadFile(uploadUrl, draft.screenshot, UPLOAD_FAILED)
      }

      return await create({
        type: draft.type,
        message: draft.message,
        screenshotId,
        context: draft.context,
      })
    },
    [generateUploadUrl, create],
  )
}
