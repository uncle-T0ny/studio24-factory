import type { GenericId } from "convex/values"
import { UserError } from "./errors"

export type StorageId = GenericId<"_storage">

const NO_FILE_RETURNED = "The upload didn't return a file."

export function storageIdOf(body: unknown): StorageId {
  const isUploadResult =
    typeof body === "object" &&
    body !== null &&
    "storageId" in body &&
    typeof body.storageId === "string"

  if (!isUploadResult) {
    throw new UserError(NO_FILE_RETURNED)
  }

  return body.storageId as StorageId
}

// POSTs the blob to a Convex upload URL (from a generateUploadUrl mutation) and returns the
// stored file's id. `failureMessage` is what the user sees when the upload is refused.
export async function uploadFile(
  uploadUrl: string,
  blob: Blob,
  failureMessage: string,
): Promise<StorageId> {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": blob.type,
    },
    body: blob,
  })

  if (!response.ok) {
    throw new UserError(failureMessage)
  }

  return storageIdOf(await response.json())
}
