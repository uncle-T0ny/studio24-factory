# Prototype: Demo client

Mockup: [mockup.html](mockup.html)

Dev app: not built. The run was `/prototype demo-client --mockup-only`: the build was timeboxed and the dev app takes a deploy, so the mockup is the prototype the client reviews.

## What the mockup covers

One self-contained page with four screens, made-up sample data only; each screen shows the IDs it covers. It reads on a phone and on a desktop.

| Screen              | Covers                             | What it shows                                                                                         |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. Plans and upload | FR-1, FR-10                        | The plans list; a new plan indoors or outdoors, measurements optional; the PDF upload of a ready plan |
| 2. Plan editor      | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 | Tables, chairs from the guest count (the slider redraws them live), own items, ceremony rows          |
| 3. Couple's link    | FR-7, FR-8, FR-11, FR-12           | The no-sign-up link, changes saved straight to the plan, the expiry date, the phone notice            |
| 4. Export PDF       | FR-9                               | The PDF for the venue: the plan and the table list                                                    |

Every `must` FR of [prd.md](prd.md) (FR-1 to FR-10) is on a screen, and the two `should` FRs (FR-11, FR-12) too. The NFRs are not screens: desktop first (NFR-2) is the editor's layout; the budget (NFR-5) is in [estimate.md](estimate.md).
