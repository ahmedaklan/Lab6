# SplitSmart Final Requirements

**Status**: Consolidated baseline for Lab 7  
**Sources**: [spec.md](./spec.md), [plan.md](./plan.md), [architecture-review.md](./architecture-review.md), and the project [constitution](../../.specify/memory/constitution.md)  
**Architecture decision**: Base architecture selected by the user; see [final-architecture.md](./final-architecture.md).

## Product scope and platform distinction

SplitSmart lets individuals share expenses within groups, review expenses before they affect balances, track completed external payments, and view reports.

The **Java 21 Swing application is the MVP desktop client**. Its planned subset includes account sign-in, groups and membership, expense entry, equal and percentage splits, optional receipts, a single-reviewer approval flow, pairwise balances, manual payment records, in-app notifications, summaries, and date-range reports. Email notifications are deferred from this MVP subset. Swing's single-reviewer flow is an MVP choice; the full product retains configurable single or multiple approval levels.

The **full product additionally requires** a primarily web-based experience, an Android application, and an iOS application. These are distinct required clients using the shared backend and data. A Swing demo or release does not satisfy those platform requirements. The delivery sequence and acceptance date remain open.

## Functional requirements

- **FR-001**: The system MUST allow a person to create an individual user account using an email address and password.
- **FR-002**: The system MUST allow a registered user to sign in using their email address and password and access their own expense and balance information, and MUST restrict group information to authorized group members.
- **FR-003**: The system MUST allow an authorized user to create a group for shared expense tracking.
- **FR-004**: The system MUST allow group administrators to add or remove members and view the group and its members; other members MUST NOT change membership.
- **FR-005**: The system MUST allow a group member to create an expense with a positive amount, date, description, and payer; zero and negative amounts MUST be rejected.
- **FR-006**: The system MUST allow an expense to be divided equally among its selected participants.
- **FR-007**: The system MUST allow an expense to be divided by participant percentages with no more than two decimal places, require the percentages to total exactly 100%, and calculate each participant's share using the largest-remainder rule at the currency's smallest unit.
- **FR-008**: The system MUST allow the submitter to identify which group users participated in an expense.
- **FR-009**: The system MUST allow an expense to include an optional receipt image and make an attached receipt available to authorized group members.
- **FR-010**: The system MUST notify other members of the relevant group in-app and by email when a new expense is created.
- **FR-011**: The system MUST place each submitted expense into review before it is included in balances.
- **FR-012**: The system MUST allow group administrators to designate one or more approvers, support a group's approval policy including a single reviewer or multiple approval levels, prohibit submitters from approving their own expenses, and include an expense in balances only after the configured approval condition is met.
- **FR-013**: The system MUST allow an authorized reviewer to approve or reject an expense and show its review outcome. Rejected and pending expenses MUST NOT affect balances.
- **FR-014**: The system MUST track how much each user owes every other user based on approved expenses and recorded payments.
- **FR-015**: The system MUST allow an authorized user to record a completed external payment, in a partial or full amount up to the outstanding balance, and reflect each payment exactly once. The system MUST NOT initiate or process money transfers.
- **FR-016**: The system MUST provide users with summaries of expenses, balances, and payments they are authorized to view.
- **FR-017**: The system MUST allow users to generate reports with a selected date range and other available report parameters.
- **FR-018**: The full product MUST provide a primarily web-based user experience.
- **FR-019**: The full product MUST provide an application that runs on Android.
- **FR-020**: The full product MUST provide an application that runs on iOS.
- **FR-021**: The system MUST record exactly one payer for each expense, separately from its participants, and MUST allow the payer to be included in or excluded from the participant split.
- **FR-022**: The system MUST authenticate registered users with their email address and password.

## Non-functional requirements

- **NFR-001**: The system MUST prevent a user from viewing another user's account information or a group's expenses, receipts, reports, and balances unless the user is authorized for that information.
- **NFR-002**: Monetary calculations MUST use the currency's smallest unit and the largest-remainder rule when allocations require rounding; participant shares MUST reconcile exactly to the original expense amount.
- **NFR-003**: For the agreed operating load, at least 95% of common user actions MUST complete or show their result within 2 seconds. The operating load and measurement environment must be established before performance acceptance.
- **NFR-004**: The system MUST keep an expense pending or rejected from affecting balances until the group's required approval condition is satisfied.
- **NFR-005**: A recorded payment MUST be reflected exactly once in payment history and the corresponding balance.
- **NFR-006**: Core workflows and information MUST remain consistent across the supported web, Android, and iOS experiences.

## Acceptance criteria

- **AC-001 (FR-001, FR-002, FR-022, NFR-001)**: Register two users with distinct email addresses and passwords and sign in with each account. Each can access their own expense and balance information; a user who is not a member cannot access a group's private information or receipts.
- **AC-002 (FR-003, FR-004)**: Create a group and verify its administrator can add and remove members and designate approvers. Verify non-admin members cannot change membership and non-members cannot view the group.
- **AC-003 (FR-005, FR-006, FR-008, FR-021)**: Submit an expense with a positive amount and an equal split. Verify the payer is recorded separately, participant shares are rounded to the currency's smallest unit using the largest-remainder rule, all shares equal the expense total, and the payer may be excluded from participants. Verify zero and negative amounts are rejected.
- **AC-004 (FR-005, FR-007, FR-008, FR-021, NFR-002)**: Submit a percentage split with no more than two decimal places and percentages totaling 100%. Verify each share is calculated and rounded to the currency's smallest unit using the largest-remainder rule, all shares reconcile to the expense total, and the payer may be included or excluded from participants. Reject percentages with more than two decimal places or totals other than exactly 100%.
- **AC-005 (FR-009, NFR-001)**: Attach and open a receipt as an authorized member. Verify an unauthorized user cannot access it and an expense without a receipt can still be submitted.
- **AC-006 (FR-011, FR-012, FR-013, NFR-004)**: Verify pending and rejected expenses do not change balances. Verify a designated approver other than the submitter can approve or reject an expense, and that approval affects balances only when the group's configured approval policy is satisfied.
- **AC-007 (FR-010, NFR-001)**: Create an expense and verify other group members receive both an in-app and email notification. Verify users outside the group receive no group-expense notification.
- **AC-008 (FR-014, FR-015, NFR-002, NFR-005)**: Calculate balances from approved expenses, record a completed external payment for less than or equal to the outstanding balance, and verify the pairwise balance is reduced by exactly that payment once. Verify an attempted overpayment is rejected and no transfer is initiated. Pending/rejected expenses must not contribute.
- **AC-009 (FR-016, FR-017, NFR-001)**: View expense, balance, and payment summaries and generate a report for a selected date range. Verify the report includes matching authorized records and excludes records outside the range.
- **AC-010 (FR-018, FR-019, FR-020, NFR-006)**: Sign in to the supported web, Android, and iOS experiences and verify each offers its declared supported workflows and consistent account and group data.
- **AC-011 (NFR-003)**: Under the agreed operating load, measure common actions and verify at least 95% complete or display a result within 2 seconds.

## Traceability and implementation boundaries

| Requirement area | Full-product coverage | Swing MVP subset |
|---|---|---|
| Accounts and access (FR-001–FR-002, FR-022) | Required | Included |
| Groups and administration (FR-003–FR-004) | Required | Included |
| Expense, payer, participants, splits, receipts (FR-005–FR-009, FR-021) | Required | Included |
| Notifications (FR-010) | In-app and email | In-app; email deferred |
| Review and approval (FR-011–FR-013) | Configurable single or multiple approval levels | Single reviewer |
| Balances and payments (FR-014–FR-015) | Required; completed external payments only | Included |
| Summaries and reports (FR-016–FR-017) | Required | Included |
| Web, Android, iOS (FR-018–FR-020) | All required; acceptance in AC-010 | Not provided by Swing |
| Privacy, money, performance, consistency (NFR-001–NFR-006) | Required as specified | Applicable MVP subset; platform consistency requires all clients |

Constitution implementation decisions—Java 21, Maven, Swing for desktop, JUnit 5, PlantUML, object-oriented design, GUI/business-logic separation, `BigDecimal`, and human review—do not replace or waive customer requirements. The selected shared-backend architecture is described in [final-architecture.md](./final-architecture.md); class/flow design and tests are in [final-design.md](./final-design.md).

## Open questions and unresolved decisions

1. What delivery sequence and acceptance date will satisfy the primarily web-based, Android, and iOS requirements alongside the Swing desktop MVP?
2. Which currencies must be supported for expense shares and balances? Each expense is assumed to use one group's currency; currency conversion is not implied.
3. Which first-time participant profile, sample size, task protocol, and success definition should be used for the proposed 90% usability target (SC-001)?
4. Which common actions, operating load, test environment, client/network conditions, and measurement procedure should be used to assess the proposed 2-second performance target (NFR-003/SC-004)?
5. The specification defines largest-remainder allocation but not how equal fractional remainders are tied. [final-design.md](./final-design.md) proposes ascending stable participant ID for deterministic tie-breaking; confirm this customer-visible rule.
6. Cloud provider/region, production availability objectives, hosting scale, and data/receipt retention and size limits remain unspecified.
7. Java HTTP framework, database engine, API schema format, web/mobile client technologies, and email provider are implementation choices not selected by the source documents.
8. Re-submission and editing rules for rejected or pending expenses are undefined and excluded from this baseline.

