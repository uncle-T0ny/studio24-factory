/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as accounts from "../accounts.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_accounts from "../lib/accounts.js";
import type * as lib_appConfig from "../lib/appConfig.js";
import type * as lib_backup from "../lib/backup.js";
import type * as lib_feedback from "../lib/feedback.js";
import type * as lib_feedbackEntries from "../lib/feedbackEntries.js";
import type * as lib_functions from "../lib/functions.js";
import type * as lib_livekitToken from "../lib/livekitToken.js";
import type * as lib_ownerData from "../lib/ownerData.js";
import type * as lib_owners from "../lib/owners.js";
import type * as lib_projects from "../lib/projects.js";
import type * as lib_shareToken from "../lib/shareToken.js";
import type * as lib_signIn from "../lib/signIn.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_voice from "../lib/voice.js";
import type * as lib_voiceData from "../lib/voiceData.js";
import type * as livekit from "../livekit.js";
import type * as migrations from "../migrations.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as share from "../share.js";
import type * as testing from "../testing.js";
import type * as voice from "../voice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  accounts: typeof accounts;
  auth: typeof auth;
  backup: typeof backup;
  feedback: typeof feedback;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/accounts": typeof lib_accounts;
  "lib/appConfig": typeof lib_appConfig;
  "lib/backup": typeof lib_backup;
  "lib/feedback": typeof lib_feedback;
  "lib/feedbackEntries": typeof lib_feedbackEntries;
  "lib/functions": typeof lib_functions;
  "lib/livekitToken": typeof lib_livekitToken;
  "lib/ownerData": typeof lib_ownerData;
  "lib/owners": typeof lib_owners;
  "lib/projects": typeof lib_projects;
  "lib/shareToken": typeof lib_shareToken;
  "lib/signIn": typeof lib_signIn;
  "lib/validators": typeof lib_validators;
  "lib/voice": typeof lib_voice;
  "lib/voiceData": typeof lib_voiceData;
  livekit: typeof livekit;
  migrations: typeof migrations;
  projects: typeof projects;
  seed: typeof seed;
  share: typeof share;
  testing: typeof testing;
  voice: typeof voice;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
