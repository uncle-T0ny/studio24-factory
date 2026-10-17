# PRD: seating-demo

Drafted from [interview/transcript-01.md](interview/transcript-01.md). Decisions: [decisions.md](decisions.md).

## Functional requirements

| ID   | Requirement                                                                    | Priority | Quote                                                                                                |
| ---- | ------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| FR-1 | The planner draws the room's floor plan and drags tables on it.                | must     | "I want an app where I draw the room and drag the tables around."                                    |
| FR-2 | The planner keeps the guest list in the app and seats guests at tables.        | must     | "A spreadsheet for the guest list and a sketch on paper for the room."                               |
| FR-3 | Couples see the plan and move guests between tables, but cannot edit the room. | must     | "They should see the plan and move guests between tables, but they must not change the room itself." |
| FR-4 | A dietary list per table, printable and exportable as a file.                  | should   | "The caterer asks me for a list per table, and I want to print it or send it as a file."             |

## Non-functional requirements

| ID    | Requirement                                                    | Priority | Quote                                                                 |
| ----- | -------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| NFR-1 | The plan is readable on a phone screen.                        | must     | "the plan has to be readable on a small screen."                      |
| NFR-2 | Guest names are visible only to the planner's team and couple. | must     | "my guests' names stay private, nobody outside my team sees them."    |
| NFR-3 | Low running cost during the trial.                             | should   | "It has to be cheap to run while I test it with a handful of events." |
| NFR-4 | Dragging a table responds immediately.                         | could    | "When I drag a table it should move right away, no waiting."          |

## Out of scope

- Payments and invitations: "Payments and invitations. I already have tools for those, so leave them out."

## Flagged

None: every quote was found in the transcript.
