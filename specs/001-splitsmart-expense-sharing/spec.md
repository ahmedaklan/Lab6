# Feature Specification: SplitSmart Expense Sharing

**Feature Branch**: `001-splitsmart-expense-sharing`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: Create a testable SplitSmart specification from `UserRequirement.md`, preserve all customer features, identify actors, scenarios, functional and non-functional requirements, acceptance criteria, traceability, open questions, and separately label the Java Swing MVP subset.

## Clarifications

### Session 2026-10-29

- Q: When a group member records an expense, how should the person who paid relate to the people sharing its cost? → A: Track one payer separately; the payer may or may not be a participant.
- Q: Who should be allowed to manage group membership and approve expenses? → A: Only group admins manage membership; admins designate one or more approvers; submitters cannot approve their own expenses.
- Q: What rules should SplitSmart apply to expense amounts, percentage totals, and rounding? → A: Require a positive amount and percentages totaling exactly 100%, with up to two decimal places. Round shares to the currency's smallest unit and give leftover units to participants whose unrounded shares lost the most during rounding.
- Q: How should members sign in and receive notifications about new group expenses? → A: Email and password; in-app and email notifications.
- Q: How should SplitSmart record payments made toward a balance? → A: Record completed external payments, allow partial or full settlement, reject payments above the outstanding balance, and do not initiate transfers.

## Actors

- **User**: A person with an account who views their own expenses and balances and participates in groups.
- **Group member**: A user who creates expenses, participates in shared expenses, views group balances, and records payments.
- **Expense submitter**: A group member who enters an expense and submits it for review.
- **Approver**: A group member designated by a group administrator to review submitted expenses; an expense submitter cannot approve their own expense.
- **Group administrator**: A member who creates and manages group membership and designates one or more approvers.
- **Report viewer**: A user who views reports for groups and expenses they are authorized to access.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join SplitSmart and organize a group (Priority: P1)

A person creates an account, signs in, and creates or joins a group with the people with whom they share expenses. They can view only their own account information and groups to which they belong.

**Why this priority**: Accounts and groups establish the people and shared context required by every other customer feature.

**Independent Test**: Create two accounts, create a group with one, add the other, sign in as each, and verify group access and account-specific information.

**Acceptance Scenarios**:

1. **Given** a person has no SplitSmart account, **When** they register with an email address and password and sign in with those credentials, **Then** they can access their own expense and balance information. (AC-001)
2. **Given** a signed-in user, **When** they create a group, **Then** they are its administrator and can add or remove members and designate approvers. (AC-002)
3. **Given** a user who is not a member of a group, **When** they attempt to view that group's expenses or balances, **Then** access is denied. (AC-001)

---

### User Story 2 - Submit and review a shared expense (Priority: P1)

A group member records an expense, identifies who paid and who shares its cost, chooses an equal or percentage split, optionally attaches a receipt, and submits it. The payer is tracked separately and may or may not participate in the split. The group's approver or approvers review it before it affects balances.

**Why this priority**: Accurate expense entry and approval are the source of the shared obligations tracked by SplitSmart.

**Independent Test**: Create a group with multiple members, submit expenses using both split methods, review them, and verify pending expenses do not change balances until approved.

**Acceptance Scenarios**:

1. **Given** an active group, **When** a member submits an expense with an amount, date, description, payer, participants, and equal split, **Then** the expense is saved as pending review with the payer recorded separately from the participants. (AC-003)
2. **Given** an active group, **When** a member submits an expense with participant percentages totaling 100%, **Then** each participant's share is calculated from the expense amount independently of whether the payer participates. (AC-004)
3. **Given** an expense with an optional receipt image, **When** it is submitted and opened by an authorized group member, **Then** the receipt is available with the expense. (AC-005)
4. **Given** an expense awaiting approval, **When** a designated approver other than its submitter approves it, **Then** it becomes eligible to affect balances only when the configured approval condition is met; if rejected, it remains excluded from balances and its review outcome is visible. (AC-006)

---

### User Story 3 - Understand and settle balances (Priority: P1)

A group member reviews the amount owed between members and records an offline or otherwise externally completed payment so the recorded obligations reflect the settlement.

**Why this priority**: A useful expense-sharing service must show who owes whom and keep those obligations current when people settle up.

**Independent Test**: Approve sample expenses, inspect pairwise balances, record a payment between members, and verify the corresponding balance is reduced by the payment amount.

**Acceptance Scenarios**:

1. **Given** approved expenses involving multiple members, **When** a member views group balances, **Then** the system shows the amount each member owes to every other member based on those expenses and recorded payments. (AC-008)
2. **Given** an outstanding balance, **When** a member records a payment between the relevant users, **Then** the payment appears in payment history and the balance reflects it exactly once. (AC-008)
3. **Given** a pending or rejected expense, **When** balances are calculated, **Then** that expense does not increase any balance. (AC-006, AC-008)

---

### User Story 4 - Stay informed and review activity (Priority: P2)

A group member is notified about new group expenses and can review summaries or request a report for a selected date range and other available parameters.

**Why this priority**: Notifications and reporting help members keep current and understand their shared spending after the core expense and balance flow works.

**Independent Test**: Submit an expense in a group, verify other members receive a notification, and generate group expense, balance, and payment summaries for a selected period.

**Acceptance Scenarios**:

1. **Given** a group member creates a new expense, **When** it is saved, **Then** other group members receive both an in-app and email notification identifying the new expense without granting access to users outside the group. (AC-007)
2. **Given** a user selects a date range and report parameters, **When** they request a report, **Then** the report summarizes matching expenses, balances, and payments and excludes activity outside the selected range. (AC-009)

---

### User Story 5 - Access SplitSmart on requested platforms (Priority: P1)

A user accesses SplitSmart through its primary web experience and through applications that run on Android and iOS, with their account and shared-expense information available on the supported platforms.

**Why this priority**: The customer explicitly requests a primarily web-based product as well as Android and iOS applications. A desktop-only implementation is not equivalent to this customer outcome.

**Independent Test**: Sign in with the same account on the web, Android, and iOS experiences and verify that authorized group, expense, approval, balance, and payment information is available consistently.

**Acceptance Scenarios**:

1. **Given** the supported web experience, **When** a user signs in, **Then** they can complete the supported SplitSmart workflows through the web product. (AC-010)
2. **Given** supported Android and iOS applications, **When** a user signs in on each, **Then** they can access the workflows and information supported for their account. (AC-010)

### Edge Cases

- An expense submission with no participants, an amount that is zero or negative, or a percentage total other than exactly 100% is rejected without creating a balance change.
- The payer may be excluded from participants; in that case, the payer is still recorded as the person who paid and is not assigned a participant share.
- A percentage with more than two decimal places is rejected; valid percentage allocations are rounded to the currency's smallest unit using the largest-remainder rule, so all participant shares reconcile exactly to the expense total.
- An expense referencing a person who is not a member of its group is rejected and is not visible to that person.
- Only a group administrator can add or remove group members or designate approvers; a non-admin's membership change is rejected.
- A reviewer cannot approve an expense they are not designated to review or an expense they submitted; a pending expense remains excluded from balances while any required approval is outstanding.
- A rejected expense remains excluded from balances, including when another member views reports or summaries.
- A payment larger than the outstanding amount is rejected; the system does not record an overpayment or initiate a transfer.
- A report with a start date later than its end date is rejected with a clear validation message; a valid range with no matching activity returns an empty report.
- If a notification cannot be delivered, the expense remains saved with its correct review state; notification failure does not approve it or change balances.

## Requirements *(mandatory)*

### Customer Requirements Inventory

The following inventory preserves every feature area in `UserRequirement.md`. These are customer requirements; technology and implementation choices are recorded separately under **Java Swing MVP Subset**.

| Customer feature | Requirement IDs | Coverage |
| --- | --- | --- |
| User accounts and login | FR-001–FR-002 | Full product; Swing MVP |
| Group creation and management | FR-003–FR-004 | Full product; Swing MVP |
| Expense details, payer, participants, equal/percentage splits, optional receipt | FR-005–FR-009, FR-021 | Full product; Swing MVP |
| Notifications for new group expenses | FR-010 | Full product: in-app and email; Swing MVP: in-app only, email deferred |
| Expense review and approval before balance changes | FR-011–FR-013 | Full product; Swing MVP with one reviewer |
| Pairwise balance tracking | FR-014 | Full product; Swing MVP |
| Payment recording and balance settlement | FR-015 | Full product; Swing MVP records payments; no transfer service implied |
| Expense, balance, payment summaries and custom reports | FR-016–FR-017 | Full product; Swing MVP includes summaries and date-range reports |
| Primarily web-based product | FR-018 | Full product; not provided by a Swing desktop application |
| Android application | FR-019 | Full product; not provided by a Swing desktop application |
| iOS application | FR-020 | Full product; not provided by a Swing desktop application |

### Functional Requirements

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

### Non-Functional Requirements

- **NFR-001**: The system MUST prevent a user from viewing another user's account information or a group's expenses, receipts, reports, and balances unless the user is authorized for that information.
- **NFR-002**: Monetary calculations MUST use the currency's smallest unit and the largest-remainder rule when allocations require rounding; participant shares MUST reconcile exactly to the original expense amount.
- **NFR-003**: For the agreed operating load, at least 95% of common user actions MUST complete or show their result within 2 seconds. The operating load and measurement environment must be established before performance acceptance.
- **NFR-004**: The system MUST keep an expense pending or rejected from affecting balances until the group's required approval condition is satisfied.
- **NFR-005**: A recorded payment MUST be reflected exactly once in payment history and the corresponding balance.
- **NFR-006**: Core workflows and information MUST remain consistent across the supported web, Android, and iOS experiences.

### Acceptance Criteria

- **AC-001 (FR-001, FR-002, FR-022, NFR-001)**: Register two users with distinct email addresses and passwords and sign in with each account. Each can access their own expense and balance information; a user who is not a member cannot access a group's private information or receipts.
- **AC-002 (FR-003, FR-004)**: Create a group and verify its administrator can add and remove members and designate approvers. Verify non-admin members cannot change membership and non-members cannot view the group.
- **AC-003 (FR-005, FR-006, FR-008, FR-021)**: Submit an expense with a positive amount and an equal split. Verify the payer is recorded separately, participant shares are rounded to the currency's smallest unit using the largest-remainder rule, all shares equal the expense total, and the payer may be excluded from participants. Verify zero and negative amounts are rejected.
- **AC-004 (FR-005, FR-007, FR-008, FR-021, NFR-002)**: Submit a percentage split with no more than two decimal places and percentages totaling exactly 100%. Verify each share is calculated and rounded to the currency's smallest unit using the largest-remainder rule, all shares reconcile to the expense total, and the payer may be included or excluded from participants. Reject percentages with more than two decimal places or totals other than exactly 100%.
- **AC-005 (FR-009, NFR-001)**: Attach and open a receipt as an authorized member. Verify an unauthorized user cannot access it and an expense without a receipt can still be submitted.
- **AC-006 (FR-011, FR-012, FR-013, NFR-004)**: Verify pending and rejected expenses do not change balances. Verify a designated approver other than the submitter can approve or reject an expense, and that approval affects balances only when the group's configured approval policy is satisfied.
- **AC-007 (FR-010, NFR-001)**: Create an expense and verify other group members receive both an in-app and email notification. Verify users outside the group receive no group-expense notification.
- **AC-008 (FR-014, FR-015, NFR-002, NFR-005)**: Calculate balances from approved expenses, record a completed external payment for less than or equal to the outstanding balance, and verify the pairwise balance is reduced by exactly that payment once. Verify an attempted overpayment is rejected and no transfer is initiated. Pending/rejected expenses must not contribute.
- **AC-009 (FR-016, FR-017, NFR-001)**: View expense, balance, and payment summaries and generate a report for a selected date range. Verify the report includes matching authorized records and excludes records outside the range.
- **AC-010 (FR-018, FR-019, FR-020, NFR-006)**: Sign in to the supported web, Android, and iOS experiences and verify each offers its declared supported workflows and consistent account and group data.
- **AC-011 (NFR-003)**: Under the agreed operating load, measure common actions and verify at least 95% complete or display a result within 2 seconds.

### Key Entities

- **User account**: A person's email address and password credentials, associated with their own expenses and balances.
- **Group**: A shared expense context with members and an approval policy.
- **Group membership**: The association between a user and a group; only group administrators can add or remove members, and administrators designate approvers.
- **Expense**: A submitted monetary event with amount, date, description, one separately recorded payer, participants, split method, optional receipt, and review state. The payer may or may not be a participant.
- **Expense allocation**: A participant's share of an expense, determined equally or by percentage.
- **Approval decision**: A reviewer's decision and the approval state required before an expense affects balances.
- **Balance**: The net amount one user owes another after approved expenses and recorded payments.
- **Payment**: A record that a user completed a partial or full external payment toward an outstanding balance; SplitSmart does not initiate or process the transfer.
- **Notification**: An in-app notice and email to group members that a new expense has been created.
- **Report**: A summary of authorized expenses, balances, or payments for selected parameters and a date range.

### Requirement Traceability

`UserRequirement.md` is authoritative for customer outcomes. FR-001 through FR-020 in the inventory above cover every original customer feature; FR-021 clarifies expense payer tracking. AC-001 through AC-010 verify the customer feature requirements; AC-011 verifies the performance target. Java, Maven, Swing, JUnit 5, and PlantUML are implementation decisions governed by `.specify/memory/constitution.md`, not customer requirements.

## Java Swing MVP Subset

This section records an implementation subset and does not replace or waive any item in the Customer Requirements Inventory.

- The MVP is a Java 21 desktop application using Java Swing, with business rules kept outside the GUI as required by the project constitution.
- The MVP includes account sign-in, group creation and membership management, expense details, equal and percentage splits, participant selection, optional receipt images, a single-reviewer approval flow, pairwise balances, manual payment records, and in-app expense notifications, summaries, and date-range reports. Email notifications are deferred from the Swing MVP but remain required for the full product.
- The single-reviewer flow is an MVP default; the full product requirement remains group-configurable and supports multiple approval levels.
- The Swing MVP does not provide the primarily web-based experience or Android/iOS applications. FR-018, FR-019, and FR-020 remain required for the full product and require a separately agreed delivery approach.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Proposed target, awaiting confirmation**: At least 90% of first-time test participants can create an account, create or join a group, and submit an expense for review without assistance. The participant profile, sample size, task protocol, and success definition remain to be agreed.
- **SC-002**: In test scenarios, every approved expense updates the relevant balances according to its allocation, while pending and rejected expenses produce no balance change.
- **SC-003**: For every test payment, the recorded payment appears once and reduces the corresponding outstanding balance by the same amount.
- **SC-004**: **Proposed target, awaiting confirmation**: At least 95% of common user actions complete or show a result within 2 seconds. The action set, operating load, test environment, client/network conditions, and measurement procedure remain to be agreed.
- **SC-005**: Authorized test users can generate expense, balance, and payment reports for a selected date range, with all matching records included and no out-of-range records included.
- **SC-006**: The full product passes platform acceptance for web, Android, and iOS; acceptance of the Swing MVP alone does not count as satisfying this criterion.

## Assumptions

- Each expense belongs to one group and uses that group's currency; currency conversion is not implied by the customer request.
- A submitted expense is pending until the configured approval policy is satisfied. In the Swing MVP, one authorized reviewer is sufficient; the full product supports single or multiple approval levels.
- A rejected expense remains available for review history but does not affect balances. Re-submission and editing rules are not defined by the customer and are not required in this baseline.
- Payments are records of completed settlements made outside the product; initiating or processing a money transfer is out of scope.
- Receipt images are optional, are visible only to authorized group members, and must be associated with the relevant expense.
- Basic reporting includes expenses, balances, and payments; custom parameters are limited to filters available to the user.
- The 90% usability and 2-second performance outcomes are proposed targets awaiting confirmation; their measurement conditions are unresolved.

## Open Questions

1. What delivery sequence and acceptance date will satisfy the customer's primarily web-based, Android, and iOS requirements alongside the Java Swing desktop MVP?
2. Which currencies must be supported for expense shares and balances?
3. Which first-time participant profile, sample size, task protocol, and success definition should be used to measure the proposed 90% usability target (SC-001)?
4. Which common actions, operating load, test environment, client/network conditions, and measurement procedure should be used to assess the proposed 2-second performance target (SC-004)?
