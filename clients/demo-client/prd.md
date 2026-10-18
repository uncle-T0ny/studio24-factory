# PRD: Demo client

From the transcript [interview/2026-10-17.md](interview/2026-10-17.md); the client's decisions are in [decisions.md](decisions.md).

## Functional requirements

| ID    | Requirement                                                                                                    | Priority | Quote                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| FR-1  | The planner makes a floor plan of a venue, indoors or outdoors, with or without the venue's exact measurements | must     | "make a floor plan of a venue for my clients, indoors or outdoors, with or without the venue's exact measurements" |
| FR-2  | The planner places tables on the plan                                                                          | must     | "I place tables"                                                                                                   |
| FR-3  | Chairs come from the guest count                                                                               | must     | "get the chairs from the guest count"                                                                              |
| FR-4  | The chairs update live when the guest count changes                                                            | must     | "And should chairs update live when the guest count changes? - yes"                                                |
| FR-5  | The planner adds her own items to the plan                                                                     | must     | "add my own items"                                                                                                 |
| FR-6  | The planner lays out the ceremony rows                                                                         | must     | "lay out the ceremony rows"                                                                                        |
| FR-7  | The couple edits the plan through a link, without signing up                                                   | must     | "The couple should be able to edit the plan through a link, without signing up."                                   |
| FR-8  | The couple's changes save straight to the planner's plan, with no approval step                                | must     | "go straight to your plan"                                                                                         |
| FR-9  | The planner exports the plan as a PDF to send to the venue                                                     | must     | "At the end I export a PDF to send to the venue."                                                                  |
| FR-10 | The planner uploads a ready-to-use floor plan, as a PDF, to start a plan from                                  | must     | "we just need to be able to upload ready to use floor plans to the app"                                            |
| FR-11 | The couple's link expires after the event date                                                                 | should   | "after the event date? - yes"                                                                                      |
| FR-12 | Opened on a phone, the link asks the couple to use a desktop                                                   | should   | "if they try to open from mobile, they will be asked to use desktop"                                               |

## Non-functional requirements

| ID    | Requirement                                                | Priority | Quote                              |
| ----- | ---------------------------------------------------------- | -------- | ---------------------------------- |
| NFR-1 | Very easy to use                                           | must     | "I need a very easy app"           |
| NFR-2 | Desktop first, for the planner and for the couples         | must     | "they'll use desktops"             |
| NFR-3 | Sized for 4 to 8 plans a month and 50 to 300 guests a plan | must     | "4-8 plans a month; 50-300 guests" |
| NFR-4 | The uploaded floor plans are PDF files                     | must     | "PDF"                              |
| NFR-5 | The build fits a budget of $1,000                          | must     | "budget 1000$"                     |

## Out of scope

- Links for the guests: only the couples get one. "the link only for couples"
- Connections to other tools (a calendar, email, a venue's own system): only the PDF upload. "no, we just need to be able to upload ready to use floor plans to the app"
- An approval step for the couple's changes. "go straight to your plan"
- Editing on a phone or a tablet. "if they try to open from mobile, they will be asked to use desktop"
- A deadline: none was set. "I have no deadline"

## Flagged

None. Every quote above is found verbatim in [interview/2026-10-17.md](interview/2026-10-17.md). One answer to note: asked for the riskiest assumption (whether couples would edit through a link without signing up, and trust it), the client answered "Yes, thanks", which confirms the assumption without testing it.
