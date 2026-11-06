# SplitSmart API Boundary Contract (Planning Draft)

This document specifies the service boundary for client and backend planning. It is not a finalized OpenAPI document. The concrete serialization format, authentication token mechanism, API framework, pagination conventions, and compatibility policy require implementation review. All endpoints use HTTPS and a versioned base path such as `/api/v1`.

## Shared contract rules

- Authenticate account operations and establish the caller identity on protected routes. The server—not the client—enforces group membership, admin, approver, and submitter authorization.
- Use a single canonical decimal string representation for monetary values and percentages in request/response payloads. Include currency code for money. Never serialize money as a binary floating-point number.
- Use stable resource IDs and timestamps with timezone information. Validate date ranges and split values before persistence.
- Return explicit validation/authorization errors; do not convert failed submission, approval, or payment into success-shaped responses.
- Use idempotency keys for payment recording and any retryable client mutation where duplicate submissions would have effects.
- Return a pending state after successful expense submission. Do not synchronously claim balances have changed before approvals are satisfied.
- Receipt reads are authorized against current group access and use a private, short-lived delivery mechanism.

## Planned operations

| Method and path | Purpose | Authorization and behavior |
|---|---|---|
| `POST /accounts` | Register with email and password | Validate account fields; response omits password/hash. |
| `POST /sessions` | Sign in | Authenticate credentials; token/session details are returned per the selected identity design. |
| `GET /groups` | List caller's groups | Returns only groups where caller is a member. |
| `POST /groups` | Create group | Caller becomes initial administrator. |
| `GET /groups/{groupId}` | Read group and membership summary | Current group member only. |
| `POST /groups/{groupId}/members` | Add member/designate group role | Group administrator only. |
| `DELETE /groups/{groupId}/members/{userId}` | Remove member | Group administrator only. |
| `POST /groups/{groupId}/expenses` | Submit expense | Group member; payer and participants must satisfy group rules; creates `PENDING`, allocations, and notification intent atomically. |
| `GET /groups/{groupId}/expenses` | List expenses | Authorized group member; supports bounded filters/pagination as finalized. |
| `GET /expenses/{expenseId}` | Read expense and review state | Authorized group member. |
| `GET /expenses/{expenseId}/receipt` | Obtain receipt access | Authorized group member; response provides a short-lived URL or streams the private content. |
| `POST /expenses/{expenseId}/decisions` | Approve or reject | Designated approver; submitter cannot decide own expense. State changes only according to approval policy. |
| `GET /groups/{groupId}/balances` | Read pairwise balances | Authorized group member; derived from approved allocations and completed payments. |
| `POST /groups/{groupId}/payments` | Record an external payment | Authorized participant; positive amount up to outstanding balance; idempotent; no transfer is initiated. |
| `GET /groups/{groupId}/reports` | Request summary/report | Authorized group member; validates date range and available filters. |
| `GET /notifications` | List caller's in-app notices | Caller sees only their own notifications. |

## Expense request shape

Planning example; exact field names and representations are subject to API review:

```json
{
  "groupId": "group-id",
  "amount": "48.37",
  "currency": "USD",
  "occurredOn": "2026-11-05",
  "description": "Groceries",
  "payerId": "user-id",
  "split": {
    "method": "PERCENTAGE",
    "participants": [
      { "userId": "user-a", "percentage": "50.00" },
      { "userId": "user-b", "percentage": "50.00" }
    ]
  },
  "receiptUploadId": "optional-upload-id"
}
```

For equal split, `method` is `EQUAL` and each participant has a `userId`; percentage values are omitted. A successful response identifies the expense and returns `status: PENDING` with calculated allocation shares. An invalid split, unauthorized group/member, or invalid amount returns a clear error without a balance change.

## Error behavior to preserve

- Invalid input (including zero/negative amount, no participants, invalid percentage precision/total, or reversed report range): validation error with field-level details where practical.
- Missing/expired authentication: authentication error; caller remains unauthenticated.
- Caller outside group or lacking admin/approver role: authorization error without disclosing protected group content.
- Submitter attempts to approve own expense or unauthorized reviewer attempts a decision: reject decision and preserve pending state.
- Payment exceeds current outstanding amount: reject payment; do not record it or initiate a transfer.
- Notification delivery failure: expense response and saved review state remain valid; worker retries delivery asynchronously.
