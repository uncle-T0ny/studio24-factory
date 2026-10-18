# Build log

Each merge to `main`, in order: the merge commit, its time (MDT), the branch, and the session's reading note.

## 8fdb7fd, 17:18, c0-comments

- Gives: the template's code without its redundant comments; only the comments that state a why the code can't show remain, ten of them reworded to one line.
- Entry points: none new; 119 files across `app/` and `agent/`, 577 lines removed.
- Tables: none.
- Decision: comments only; the bundled output is unchanged (esbuild-identical).
- Gates: app check (162 tests) and build, agent check and `tsc`, all green.

## 1ae004f, 17:19, d1-docs

- Gives: the PRD, the decisions, the stage map, and `/pre-commit` enforcing NFR-1 to NFR-9.
- Entry points: `CLAUDE.md:9`, `docs/DECISIONS.md:42`, `docs/PRD.md:6`, `.claude/skills/pre-commit/SKILL.md:17`.
- Tables: none.
- Decision: `CLAUDE.md` keeps the template's code rules below the stage map.
- Gap: Prettier covers `app/` only; the root docs are formatted by hand.

## 18402ed, 17:24, s3-prd (d703432, the llm.ts interface)

- Gives: one interface for every model call; with no `OPENROUTER_API_KEY` it returns the task's recorded answer, labelled "recorded demo answer".
- Entry points: `askLlm(request, countCall)` at `app/convex/lib/llm.ts:124`; the recorded answers at `app/convex/lib/recordedAnswers.ts:232`.
- Tables: none.
- Decision: `countCall` is bound to F1's usage check, so the cap is checked before each model call runs.
- Gates: app check (167 tests) and build, green.

## b206569, 17:25, s5-framework (3e3b17a)

- Gives: the `CLAUDE.md` process (what each stage skill reads, writes and sets), the `clients/demo-client/` skeleton, `clients-private/` gitignored, a privacy check on `clients/`, and one command that sets a client's stage in Convex, mirrored in `state.json`.
- Entry points: `CLAUDE.md:9`, `CLAUDE.md:52`, `app/scripts/check-privacy.ts:33`, `app/scripts/lib/privacy.ts:24`, `app/scripts/client-state.ts:21`, `app/scripts/lib/clients.ts:19`.
- Tables: none directly; `client-state.ts` calls `projects:setStage`.
- Decision: Convex first, `state.json` only after Convex accepts; rejected: the file first, synced later.
- Gaps: the stage list in `scripts/lib/clients.ts` mirrors F1's enum by hand; the email test flags placeholders too; the real Convex run is proven only against a local stub until S1 merges.
- Integrator: `npm run check` now runs `check:privacy` (935103d). Gates: app check (178 tests, privacy included) and build, green.

## 9183a56, 17:26, s3-prd (b89734b, PRD drafting)

- Gives: the PRD drafted from a transcript, checked, and its quotes verified against what the client said; the `InterviewTurn` task for S2's text interview.
- Entry points: `draftPrd` at `app/convex/lib/prd.ts:96`, `verifyQuote` at `app/convex/lib/prd.ts:120`, `transcriptAsData` at `app/convex/lib/transcript.ts:10`, the made-up fixture in `app/convex/lib/fixtureTranscript.ts`.
- Tables: none; pure functions.
- Decisions: one retry, told what was wrong, then a second invalid answer is kept and flagged; a quote is verified only when a client turn holds it word for word.
- Gates: app check (187 tests) and build, green.

## e227fe1, 17:28, s7-skills (e4ecc75)

- Gives: one skill per stage, each provable headless: `npm run skill-test -- <skill>`.
- Entry points: `app/scripts/skill-test.ts:166`, `.claude/skills/prd/SKILL.md:1`.
- Tables: none; writes `clients/<slug>/` files, and the stage via `client-state.ts`.
- Decision: one fixture holding the client after every stage, and the test deletes what the skill makes; rejected: chaining skills (slow, flaky).
- Gaps: prototype registration calls S4's `prototypes:registerPrototype` in a follow-up commit; the dev-app path is untested (the test runs the mockup only).
- Gates: app check (187 tests) and build, green; merged without conflicts.

## c314721, 17:29; 35b569e, 17:35; 96a3bb2, 17:39: f1-foundation (a1d5fa0, 551b2a8, 5e9f5c0)

- Gives: Studio24 Factory sign-in, a one-click demo developer, an empty demo client with a printed client link, and the access, usage and schema every stage builds on.
- Entry points: `convex/schema.ts:21`, `convex/lib/functions.ts:17` and `:23`, `convex/lib/access.ts:87`, `convex/lib/usage.ts:19`, `convex/seed.ts:141` and `:154`, `convex/auth.ts:28`.
- Tables: all; writes `projects`, `stageEvents`, `clientLinks`, `usage`.
- Decision: client tokens stored as SHA-256 hashes, so each start renews the printed link; rejected: plain tokens.
- Gap: a link opens its stages without checking the project reached them (S1 fixes).
- Integrator: d6abd4b regenerates `convex/_generated/api.ts` over S3's lib files; f0e4dad fixes `e2e/backup.spec.ts` for the plan's project fields. Gates on each: check, build, e2e green (e2e 9/9, then 10/10).

## 5cd35e0, 17:39, s2-voice (2db5b15, the text interview)

- Gives: the text interview at `/c/:token/interview` when voice is off or fails; recorded questions labelled; "Use the sample answer" fills `FIXTURE_TRANSCRIPT`.
- Entry points: `src/interview/InterviewPage.tsx:12`, `convex/interviews.ts:84` startText, `:114` answer, `:143` ask (InterviewTurn).
- Tables: writes `interviews`, `transcriptTurns`.
- Decision: the voice fallback starts a new text interview with the failure recorded.
- Gaps: text interviews don't spend the interviews cap; a failed model turn ends the interview as failed.
- Gates: check (187 tests), build, e2e 10/10. Deployed with F1's name commit at 17:40.

## 9d2ccb7, 17:47, s2-voice (0d8cfcc, the opening-question fix)

- Gives: the text interview works with a real key: the opening question sends a placeholder instead of an empty user message, which the provider refused (400), ending the interview as failed on prod.
- Entry point: `convex/interviews.ts:157`; a regression test in `convex/interviews.test.ts`.
- Gates: check (188 tests), build, e2e 10/10.

## e9a1f0e, 17:49, s3-prd (f1928ab, the PRD, analysis and estimate)

- Gives: the PRD page drafts FRs and NFRs from the interview, unverified quotes highlighted, flagged when invalid twice; the analysis page shows verdicts, hours, $/month and where each free tier breaks; with no key the answers are recorded and labelled.
- Entry points: `convex/prd.ts:68`, `:93`; `convex/estimates.ts:60`, `:105`; `convex/lib/llm.ts:132`; `convex/lib/prd.ts:75`; `src/prd/PrdPage.tsx:73`; `src/analysis/AnalysisPage.tsx:71`.
- Tables: reads `transcriptTurns`, `templates`; writes `prds`, `requirements`, `decisions`, `templates`, `verdicts`, `estimates`, `usage`.
- Decision: the Convex validators are the one shape: the JSON schema sent to the model and the answer check both derive from them; rejected: hand-written JSON schemas.
- Gaps: `addByLink` has no UI (parked), so the analysis uses the latest or the seeded template; the estimate's label follows the deployment's key; 874 new code lines and 291 of data, over the 400 target.
- Gates: check (198 tests), build.

## 88da9ba, 17:50, s1-workspace (dfd100b, stages and client links)

- Gives: the owner moves a project's stage (the stage picker on the timeline) and issues or revokes one-stage client links; a client link opens its stage once the project has reached it, else names the current stage.
- Entry points: `convex/projects.ts:16` moveToStage, moveStage, setStage; `convex/links.ts`; `convex/lib/access.ts` requireClientStage; `src/projects/StageTimeline.tsx`; `src/links/ClientLinks.tsx`; `src/links/ClientLandingPage.tsx`.
- Tables: `projects`, `stageEvents`, `clientLinks`.
- Decision: the timeline status comes from the stage's position in STAGES, and stageEvents only add dates; rejected: storing every status.
- Gaps: sign-up is allowlisted, so the final gate admits owners only; the link URL is shown once; 397 new lines.
- Integrator: the `convex/_generated/api.ts` conflict resolved as the union of both sides. Gates: check (209 tests), build, e2e 14/14.

## 101a5c7, 17:52, s4-feedback (b5d87d3, prototypes and client feedback)

- Gives: the client opens the prototype and sends written or spoken feedback, sorted into works, broken and request.
- Entry points: `convex/prototypes.ts:72` registerPrototype, `:96` uploadMockup; `convex/clientFeedback.ts:127` submitText, `:157` submitVoice, `:264` transcribeAndSplit; `src/clientFeedback/ClientFeedbackPage.tsx:35`.
- Tables: reads `projects`; writes `prototypes`, `clientFeedback`, `usage`.
- Decision: the browser sends WAV and the server measures the cap from the file size; rejected: trusting the client's duration.
- Gaps: the "recorded demo answer" label follows the key at view time; a failed split shows one line; 707 new lines, over the 400 target (main agreed).
- Integrator: `app/.env.example` names `OPENROUTER_API_KEY` and `FEEDBACK_STT_MODEL` (d5596ba). Gates: check (221 tests), build, e2e 16/16.

## 870e6f3, 17:53, s2-voice (fc777fc, the voice interviewer)

- Gives: the voice interviewer in the PRD's question order; it confirms ambiguous answers and keeps each question to 30 words at most; same-speaker segments merged into one turn.
- Entry points: `agent/src/main.ts:101`, `agent/src/prompts.ts:2`, `agent/src/transcript.ts:59`, `app/convex/lib/voiceData.ts` storeTurn.
- Tables: `interviews` (live at the first turn, done at the end), `transcriptTurns`.
- Decision: merge same-speaker messages by index, and keep the 800 ms endpointing too.
- Deploy: `LOG_LEVEL=warn`, `VOICE_MAX_SECONDS` 600, `TimeoutStopSec` 720, the token TTL equal to the interview's maximum.
- Gates: app check (222 tests), build, e2e 16/16; agent check (20 tests) and `tsc`.

## a22af31, 17:58, s7-skills (915499b, the orchestrator and learnings)

- Gives: `/orchestrator <slug>` says the client's stage, what is done and missing, and the one next skill, and logs `progress.md`; every skill keeps a `learnings.md`, and `/wrap-up` records what a session learned; `/prototype` registers and uploads the mockup through S4's mutations; `CLAUDE.md` now only links.
- Entry points: `.claude/skills/orchestrator/SKILL.md:1`, `CLAUDE.md` "Start here", `app/scripts/skill-test.ts:189`.
- Tables: none directly; the skills call `projects:setStage`, `prototypes:registerPrototype` and `prototypes:uploadMockup`.
- Decision: the orchestrator never sets the stage itself; the stage skills do.
- Gaps: launching sessions is untested by design.
- Gates: check (222 tests), build; Prettier on `CLAUDE.md` and the skills.

## 497ff53, 18:00, s2-voice (cf7d782, a shorter interview)

- Gives: from the developer's live interview: at most five questions, never about deadlines, dates or budget; after the fifth answer the interviewer thanks the client and stops, in text and in voice.
- Entry points: `app/convex/interviews.ts` (`MAX_QUESTIONS`, `CLOSE_NOW`), `agent/src/prompts.ts`.
- Gates: app check (223 tests), build, e2e 16/16; agent check (20 tests) and `tsc`.

## 79c4177, 18:04; 2297694, 18:05; 0e0c2e3, 18:06: s2-voice (c85ee27, bea471f, e1181cd)

- Gives: from the developer's live interview: the transcript as chat bubbles in regular weight, in text and in voice; an empty interviewer turn is never stored or shown.
- Entry points: `app/src/interview/interview.css`, `app/src/interview/TextInterview.tsx`, `app/src/voice/VoiceSession.tsx`, `app/convex/interviews.ts` saveQuestion, `app/convex/lib/voiceData.ts`.
- Gates: check (224 tests), build, e2e 16/16 on each.
- Integrator: the agent on the host is now built with `npm run build` (`tsconfig.build.json`); `tsc -p .` emits nothing, so the first two agent deploys ran the template's earlier build until 18:04.

## 8e45947, 18:12, p1-demo-pipeline (8c5499d, the demo client end to end)

- Gives: the made-up demo client carried from the live interview to the prototype: the transcript, the PRD, the decisions, the template analysis, the estimate and a clickable mockup, all in `clients/demo-client/`.
- Prod: the integrator ran the stage moves and the mockup upload (`prototypes:uploadMockup`, `projects:setStage` to prototype, then feedback); the stage is feedback.
- Checks: the privacy check passes; no email address or person name in the folder.

## 363bd6a, 18:14, s2-voice (b9113a6, one bubble per speaker run)

- Gives: one shared `src/interview/ChatTranscript.tsx` for text and voice; a speaker's consecutive turns join into one bubble, and a restart keeps the longer text; the stored turns are untouched.
- Gates: check (225 tests), build, e2e 16/16.

## 2d10c32, 18:18, p1-mockup-kit (4fb9919, the mockup in the template's look)

- Gives: the demo client's mockup redone with the template's own `tokens.css`, `components.css` and `ui-` classes, so the prototype looks like the app it would become; `/prototype` now inlines the kit.
- Prod: the integrator uploaded it with `prototypes:uploadMockup` at 18:18; the client's link shows the newest upload. No stage change.
- Gates: check (225 tests); the privacy check passes, no email address or person name.

## 0a0bca9, 18:21, p1-feedback (29527b8, the demo client's feedback)

- Gives: the client's feedback, sent on production through the feedback link and sorted by the model into one broken point and one request; `/feedback` recorded it in `clients/demo-client/feedback/2026-10-17.md` and as decision D-10 (show the prototype on the whole screen).
- Checks: the privacy check passes; no email address or person name.

## a3320c2, 18:38, s2-voice (4f3656c and 20558e6, on the developer's word after the freeze)

- Gives: the client's prototype spans the page, a full viewport high, on the prototype and feedback pages (the client's feedback D-10); the developer's project page shows each reached stage's output in place (transcript excerpt, PRD summary, estimate, prototype preview and link, feedback items) and an example card for a stage with no data.
- Entry points: `app/convex/stageOutputs.ts`, `app/src/projects/StageOutputs.tsx`, `app/src/prototype/PrototypeFrame.tsx`.
- Gates: check (225 tests), build, e2e 16/16.
