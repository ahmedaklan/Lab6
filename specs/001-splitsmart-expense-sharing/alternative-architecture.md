# SplitSmart Alternative Architecture: Event-Driven Services

**Status**: Alternative to [plan.md](./plan.md)  
**Scope**: Full SplitSmart product, including its Swing MVP slice and required web, Android, and iOS clients.

## Architecture

This alternative organizes SplitSmart as independently deployable domain services that publish business events. Each service owns its data; other services build local read models by consuming events. Clients use a shared HTTPS API edge, which routes requests to the service responsible for the use case.

The expense service validates submissions and publishes `ExpenseSubmitted`. Approval, notification, balance, and reporting services react to events. A submission is pending and affects balances only after the approval service publishes `ExpenseApproved` once group policy is satisfied. A durable broker, stable event IDs, and idempotent consumers allow recovery after failures.

### Components

- **Clients**: Primary web application, Android and iOS apps, plus Java 21 Swing MVP. Swing is a desktop slice only; it does not fulfill FR-018-FR-020. UI handlers delegate to application/API interfaces.
- **API edge and identity**: Terminates HTTPS, authenticates email/password accounts, routes requests, and applies limits. Every owning service enforces membership, admin, approver, and submitter authorization.
- **Identity and group service**: Owns accounts, groups, memberships, administrator roles, approver assignments, and approval policies. Publishes membership and policy changes.
- **Expense service**: Owns submissions, payer, participants, split inputs and calculated allocations, status, and receipt metadata. Validates members, positive amounts, and splits. Stores accepted expenses as pending and publishes `ExpenseSubmitted`.
- **Approval service**: Owns review decisions and progress. Prevents unauthorized and self-approval. Publishes `ExpenseApproved` only when policy is satisfied; rejection publishes `ExpenseRejected`.
- **Balance and payment service**: Owns completed external payment records and pairwise balance projections. Consumes approved allocations and payments, validates payments against outstanding balances, and records each exactly once. It never initiates transfers.
- **Notification service**: Consumes expense events and delivers in-app and email notifications to other group members. Retries delivery independently; failure cannot approve or undo an expense.
- **Reporting service**: Builds authorized expense, balance, and payment read models and answers summary and date-range queries.
- **Receipt storage**: Private object storage holds image bytes. Expense metadata uses opaque keys. Membership authorization is checked before issuing a short-lived URL or streaming a receipt.
- **Event broker**: Durably delivers and retains versioned events for replay. Consumers deduplicate event IDs and track progress.

Each service has a local relational database and atomically publishes events through a transactional outbox or equivalent. Services do not share table writes or use distributed database transactions. At-least-once delivery, idempotent consumers, explicit retries, and projection reconciliation handle cross-service failures.

Money and allocations use `BigDecimal`, never floating point. Percentage splits accept no more than two decimal places and must total exactly 100%; largest-remainder rounding reconciles to the currency's smallest unit. Equal splits also reconcile exactly. Payer identity is separate from participation.

## Expense submission

1. The member enters amount, date, description, payer, participants, split method, and optional receipt in a supported client.
2. The API edge authenticates the request and routes it to Expense Service.
3. Expense Service verifies the submitter, payer, and participants are members; validates required fields and split; and calculates shares with `BigDecimal`.
4. If supplied, the receipt is stored privately and linked by opaque key. Failed submission cannot expose a public receipt.
5. In one local transaction, the service saves a pending expense and its `ExpenseSubmitted` event. It returns the pending ID. Invalid requests create no expense.
6. Broker consumers create approval work and send in-app and email notifications. Notification retries do not affect the expense.
7. A designated approver other than the submitter records a decision. Once the configured policy is met, `ExpenseApproved` is published. Rejection publishes `ExpenseRejected`; pending and rejected expenses remain excluded from balances.
8. Balance Service applies approved allocations and completed payments idempotently. Reporting and balance projections can lag; queries expose freshness.

### Activity diagram: submit an expense

```plantuml
@startuml
title Submit an expense in the event-driven architecture
start
:Member enters expense details
and optional receipt;
:Client sends HTTPS command;
:API edge authenticates and routes
to Expense Service;
if (Authorized group member?) then (yes)
  :Check payer and participants
are group members;
  if (Payload and split valid?) then (yes)
    :Calculate shares using BigDecimal;
Apply largest-remainder rounding;
    if (Receipt attached?) then (yes)
      :Store receipt in private object storage;
record opaque reference;
    endif
    :Atomically persist PENDING expense
and ExpenseSubmitted event;
    :Return pending expense ID;
    :Broker delivers event;
    fork
      :Notification Service sends
in-app and email notices;
    fork again
      :Approval Service opens review;
    end fork
    :Designated approver reviews;
submitter cannot approve;
    if (Approval policy satisfied?) then (yes)
      :Publish ExpenseApproved;
      :Balance Service updates
pairwise projection once;
    else (no)
      if (Rejected?) then (yes)
        :Publish ExpenseRejected;
exclude from balances;
      else (awaiting)
        :Remain pending;
exclude from balances;
      endif
    endif
    stop
  else (no)
    :Return validation error;
create no expense;
    stop
  endif
else (no)
  :Return authentication or
authorization error;
  stop
endif
@enduml
```

## Class diagram

The classes show service ownership and event relationships, not a shared object graph or final schema.

```plantuml
@startuml
title SplitSmart event-driven service and domain model
hide empty members
skinparam classAttributeIconSize 0
left to right direction

package "Identity and Groups" {
  class IdentityAccount { +userId: UUID; +email: String; -passwordHash: String }
  class Group { +groupId: UUID; +name: String; +currency: String; +approvalPolicy: ApprovalPolicy }
  class Membership { +role: MemberRole; +status: MembershipStatus }
  IdentityAccount "1" -- "0..*" Membership
  Group "1" -- "1..*" Membership
}
package "Expense Service" {
  class Expense { +expenseId: UUID; +amount: BigDecimal; +currency: String; +occurredOn: LocalDate; +description: String; +status: ExpenseStatus }
  class Allocation { +percentage: BigDecimal; +share: BigDecimal }
  class ReceiptReference { +receiptId: UUID; +objectKey: String; +contentType: String }
  class ExpenseSubmitted { +eventId: UUID; +schemaVersion: int }
  Expense "1" *-- "1..*" Allocation
  Expense "1" *-- "0..1" ReceiptReference
  Expense ..> ExpenseSubmitted : publishes
}
package "Approval Service" {
  class ApprovalCase { +expenseId: UUID; +state: ReviewState }
  class ApprovalDecision { +decisionId: UUID; +outcome: ApprovalOutcome; +decidedAt: Instant }
  class ExpenseApproved { +eventId: UUID; +expenseId: UUID }
  class ExpenseRejected { +eventId: UUID; +expenseId: UUID }
  ApprovalCase "1" *-- "0..*" ApprovalDecision
  ApprovalCase ..> ExpenseApproved : publishes when policy met
  ApprovalCase ..> ExpenseRejected : publishes on rejection
}
package "Balance and Payment Service" {
  class Payment { +paymentId: UUID; +amount: BigDecimal; +completedAt: Instant; +externalReference: String }
  class BalanceProjection { +groupId: UUID; +asOf: Instant }
  class BalanceEntry { +debtorId: UUID; +creditorId: UUID; +amount: BigDecimal }
  Payment ..> BalanceProjection : reduces obligation once
  BalanceProjection "1" *-- "0..*" BalanceEntry
  ExpenseApproved ..> BalanceProjection : consumes allocations
}
package "Notification and Reporting" {
  class Notification { +notificationId: UUID; +channel: NotificationChannel; +deliveryStatus: DeliveryStatus }
  class ReportProjection { +groupId: UUID; +updatedAt: Instant }
  ExpenseSubmitted ..> Notification : triggers
  ExpenseSubmitted ..> ReportProjection : activity
  ExpenseApproved ..> ReportProjection : approved expense
  ExpenseRejected ..> ReportProjection : outcome
}
class EventBroker { +publish(event); +deliver(eventId, consumer) }
class PrivateObjectStorage { +put(receiptBytes): ObjectKey; +authorizedRead(objectKey, expiry) }
EventBroker ..> ExpenseSubmitted : durable delivery
EventBroker ..> ExpenseApproved : durable delivery
EventBroker ..> ExpenseRejected : durable delivery
ReceiptReference ..> PrivateObjectStorage : opaque key
note bottom of EventBroker
Consumers deduplicate stable event IDs.
Each service owns its database and
publishes atomically with local state.
end note
@enduml
```

## Deployment

Deploy each domain service as a Java 21 container built with Maven. All clients connect to the HTTPS API edge; clients never connect directly to databases or the broker.

- **Edge and services**: TLS load balancer/API gateway routes authenticated requests to stateless service instances. Services enforce authorization at their boundary.
- **Data**: Each service uses its own managed relational database or isolated schema and restricted credentials, encrypted connections, backups, managed secrets, and versioned migrations. No service writes another service's tables.
- **Broker**: Use a managed durable broker with retention, access controls, schema checks, dead-letter handling, and lag monitoring. The local outbox prevents lost events. Persist consumed event IDs with projection changes.
- **Receipts and email**: Private encrypted object storage enforces file limits and types. Notification Service uses a replaceable email adapter with credentials in a secret manager.
- **Operations**: Centralize logs, metrics, and traces with correlation IDs. Monitor service health, broker lag, failed deliveries, retries, backups, and projection freshness. Keep replay and reconciliation procedures.
- **Release**: Ship Swing as a signed desktop distribution targeting the hosted API. Release web and mobile clients on their platform channels. Build Java on 21, run JUnit 5 and contract/integration checks, deploy to staging, smoke-check, then promote immutable artifacts with rollback support. Human review is required.

Cloud vendor, region, availability, retention, and production load remain open and must be selected before sizing infrastructure.

## Main tradeoff versus the base plan

The base plan uses a modular backend and a separate outbox notification worker. This alternative makes domain boundaries deployable services coordinated by a durable event stream.

It allows independent scaling, ownership, and release cadence, and projections can be rebuilt from events. It also requires a broker, multiple databases, event-version management and replay, eventual consistency, and more difficult cross-service diagnosis. An approved expense may take time to appear in balances and reports. The base plan is simpler for a small team or modest load; this design suits a system where service ownership or independent scaling justifies that cost.

## Alignment with the constitution and specification

- Java production components and Swing target Java 21; Maven is the Java build system.
- Swing is only a desktop slice; the full product retains the primary web, Android, and iOS requirements (FR-018-FR-020, AC-010).
- JUnit 5 coverage should include money allocation, approval policy, authorization, projection idempotency, payment limits, and service contracts.
- Diagrams are PlantUML. Service/domain types have cohesive responsibilities; Swing delegates to application interfaces.
- `BigDecimal` and explicit minor-unit rounding apply to money. Pending/rejected expenses do not affect balances. Payments record completed external settlements only.
- Group authorization protects expenses, reports, and receipts; admins control membership and approvers; submitters cannot approve themselves.
- Customer outcomes remain grounded in [spec.md](./spec.md); these service boundaries are implementation choices. Open questions in the spec remain open.
- This AI-generated design and diagrams require human review before acceptance.
