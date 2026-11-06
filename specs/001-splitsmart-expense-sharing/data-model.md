# SplitSmart Conceptual Data Model

This is a conceptual model for architecture planning, not a physical schema or migration. The authoritative customer behavior is in [spec.md](./spec.md); the class diagram is in [plan.md](./plan.md).

## Entities

| Entity | Core attributes | Relationships and rules |
|---|---|---|
| **UserAccount** | `userId`, normalized `email`, password hash, account status, timestamps | Owns group memberships and submits expenses. Store only a password hash; never return it through the API. |
| **Group** | `groupId`, name, currency code, approval policy, timestamps | Has one or more memberships and zero or more expenses/payments. Each expense uses its group's currency; currency conversion is not implied. |
| **Membership** | `groupId`, `userId`, role, status, joined/removed timestamps | Associates a user with a group. Only an admin may add/remove members or designate approvers. Authorization is checked on every group operation. |
| **Expense** | `expenseId`, `groupId`, `submitterId`, `payerId`, amount, currency, occurred-on date, description, split method, status, created timestamp | Exactly one payer, stored independently of participants. Starts pending. The payer may or may not have an allocation. |
| **Allocation** | `expenseId`, `participantId`, percentage (percentage split), share amount | One or more allocations per expense. Participant must be a group member. Shares are non-negative currency-minor-unit amounts and sum exactly to the expense amount. |
| **ApprovalDecision** | `decisionId`, `expenseId`, `reviewerId`, outcome, comment (optional), decision timestamp, approval level | Reviewer must be designated for the group and cannot be the submitter. Expense enters approved state only when the configured policy is fulfilled; rejection excludes it from balances. |
| **ReceiptMetadata** | `receiptId`, `expenseId`, object key, content type, size, checksum, created timestamp | Optional, at most one attachment in the baseline plan. Private object bytes are stored outside the relational database. Every retrieval requires current authorization. |
| **Payment** | `paymentId`, `groupId`, payer user, payee user, amount, completed timestamp, external reference (optional), idempotency key | Represents an already completed external payment; it never triggers a transfer. Amount must be positive and no greater than the outstanding amount at recording time. A unique idempotency key prevents duplicate recording. |
| **Notification** | `notificationId`, `groupId`, recipient user, optional `expenseId`, channel, status, created/delivered timestamps | In-app or email notification to other members after expense submission. Delivery failure does not alter expense state or balances. |
| **OutboxMessage** | `messageId`, event type, aggregate id, payload/reference, status, attempts, next attempt, created timestamp | Written in the same transaction as the expense. Worker retries delivery; processing is idempotent. |
| **ReportQuery** | start/end dates, optional filters, requesting user | A validated query object, not necessarily a persisted entity. Results include only records the requester is authorized to view. |

## Invariants and validation

- Amount must be positive. Money and shares use `BigDecimal`; the currency's minor unit and rounding mode are explicit.
- Every expense belongs to exactly one group, has exactly one payer, and has at least one participant allocation. Payer participation is optional.
- Equal splits divide the total across participants in minor units using largest remainder. Percentage inputs have no more than two decimal places and total exactly 100%; rounded shares use largest remainder so their sum equals the expense total.
- Submitted expenses are `PENDING`; rejected and pending expenses never contribute to balances. Approved expenses contribute only when the required group approval policy is satisfied.
- A submitter cannot review their own expense. Reviewers must be authorized for that group and approval level.
- Every participant and payer referenced by an expense must satisfy the group's membership rules at submission time. Group membership and role must be checked server-side.
- A recorded payment refers to the appropriate group users, has a positive amount no greater than the outstanding obligation, and is reflected exactly once. No money transfer is initiated.
- Receipt access, notification delivery, and report queries are constrained to authorized group members.
- A report start date later than its end date is rejected; a valid range with no matching records returns an empty result.

## State and balance behavior

```text
Expense:
  submitted -> PENDING
  PENDING -> APPROVED (only once policy is satisfied)
  PENDING -> REJECTED
  PENDING/REJECTED -> no balance contribution
  APPROVED -> allocation obligations included in balance derivation

Payment:
  external payment completed -> validate outstanding amount -> record once
  recorded payment -> reduce corresponding obligation once
```

Editing, resubmission, currency conversion, and balance snapshot persistence are outside the current baseline because the spec does not define those behaviors. Any later addition must preserve the stated invariants and requirement traceability.
