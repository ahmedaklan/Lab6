# SplitSmart Final Architecture

**Decision**: The user selected the base architecture in [plan.md](./plan.md). This document records that choice as the Lab 7 architecture baseline.

## Decision and rationale

Use one modular Java backend and one relational source of truth for application data, with a separate notification worker. This is preferred over the event-driven multi-service alternative in [alternative-architecture.md](./alternative-architecture.md) for the first release because one backend can validate approvals and derive balances from the same authoritative records. The separate worker moves slow email delivery out of the user's request path without introducing multiple domain services, databases, and a broker.

The [architecture review](./architecture-review.md) found no established production traffic or team-size need for independently deployable services. The modular backend is simpler to build, test, deploy, and diagnose for this project. The alternative remains a possible future direction if reporting or another bounded workload grows enough to justify its added operational cost; it is not the selected baseline.

## Components and responsibilities

1. **Clients**
   - **Swing MVP**: Java 21 desktop UI. Swing event handlers delegate to application/API interfaces; they contain no business rules.
   - **Web**: required primary full-product experience.
   - **Android and iOS**: required full-product applications.
   - All clients use the same authenticated HTTPS API and server-calculated money values. The technology and rollout order for web/mobile are not selected.
2. **HTTPS API and identity/authorization**
   - Versioned service boundary for account, group, expense, approval, balance, payment, notification, receipt, and report use cases.
   - Authenticates email/password accounts and checks group membership, administrator, approver, and submitter permissions server-side on every protected operation.
3. **Application services**
   - Coordinate use cases and transaction boundaries. Keep presentation and transport details out of the domain model.
4. **Domain**
   - Encapsulates users, groups, memberships, approval policy, expenses, allocations, decisions, payments, and report query rules.
   - Uses `BigDecimal`; validates positive amounts, membership, split rules, and state transitions. The payer is separate from cost participants.
5. **Relational database**
   - The shared system of record for users, groups, memberships, expenses, allocations, approval decisions, payment records, notification records, and outbox work.
   - Expense submission stores a pending expense, its allocations and receipt metadata, and notification outbox records in one transaction. Pending/rejected expenses do not enter balance calculations.
   - Balance queries derive pairwise obligations from approved allocations and completed external payment records. Any future cached view must be rebuildable from these records.
6. **Private receipt object storage**
   - Stores image bytes outside expense rows; the database stores metadata and an opaque key. Access requires current authorization and short-lived delivery; objects are not public.
7. **Notification outbox and worker**
   - The API transaction creates durable work in the database outbox. A separate Java 21 worker polls/claims work, creates in-app notices, and sends email through a replaceable provider adapter.
   - Retryable notification delivery cannot delay an approval decision, roll back a submitted expense, or change its review state. Failed delivery is observable and retried.
8. **Reporting**
   - Authorized queries summarize expenses, balances, and payments over validated ranges. Reporting reads the same authoritative records; no separate reporting service is needed initially.

### Expense and approval lifecycle

1. Client submits an expense over HTTPS.
2. API authenticates the user and verifies group membership, payer and participant eligibility, amount/date/description, and split validity.
3. Domain allocation uses exact decimal arithmetic and largest-remainder rounding to produce shares summing to the expense total.
4. A database transaction persists the expense as `PENDING`, allocations, optional receipt metadata, and notification outbox intent. It commits before a successful pending response is returned.
5. The notification worker asynchronously delivers in-app and email notices to other group members. The expense remains pending regardless of email availability.
6. A designated approver other than the submitter records a decision. A policy-satisfied approval makes the expense balance-eligible; rejection leaves it excluded. Approval outcome and decision history remain visible to authorized members.
7. Balance queries include only approved allocations and recorded completed external payments. Payments are records of transfers already completed elsewhere; SplitSmart does not initiate transfers.

## Persistence and concurrent payment control

Use a relational transaction for payment validation and recording. A payment must not be validated from a stale balance and then inserted after another concurrent request has consumed that balance.

For each group/debtor/creditor/currency balance pair, serialize balance-changing transactions with a database guard row (created if absent and locked for update). Within that same transaction:

1. Acquire the pair guard lock.
2. Re-read approved expense allocations and recorded payments that determine the current outstanding amount.
3. Reject an amount greater than the outstanding amount.
4. Insert the completed external payment with a unique idempotency key and update any derived balance view if one is maintained.
5. Commit while retaining the lock until transaction completion.

Expense approval affecting pairwise obligations must use the same guard rows, locking multiple pairs in a stable sorted order to avoid deadlocks. Payment retries with the same idempotency key return the existing result rather than creating another payment. On serialization/deadlock retry, recompute the balance before attempting the write again. The exact database engine and locking syntax are not selected.

## Deployment

- **Desktop**: Package the Swing MVP as a signed Java desktop distribution configured to use the hosted API. No database access or production secrets are embedded in clients.
- **Web/mobile**: Deploy the primary web experience and distribute Android/iOS applications through their selected channels; each uses the same API. Swing completion is not acceptance of these platforms.
- **Edge**: HTTPS reverse proxy/load balancer terminates TLS and routes API calls. Apply health checks and request-size limits, especially for receipt uploads.
- **API**: Deploy the Java 21 Maven-built backend as a stateless hosted service/container. Keep business logic portable across hosting providers.
- **Worker**: Deploy a separate Java 21 worker process/container. Scale independently if email or in-app notification backlog requires it.
- **Database**: Managed relational service with encrypted storage/connections, automated backups, restricted credentials, and versioned migrations. Store credentials in a secret manager.
- **Object storage**: Private encrypted bucket/container for receipts, with access controls and short-lived authorized reads.
- **Email**: External email provider behind an adapter; provider credentials in managed secrets. Email errors are observable and retried.
- **Operations**: Central logs/metrics/traces with correlation IDs. Monitor API latency/errors, database health, outbox age/backlog, email retries, receipt storage, and backups. Do not log passwords, tokens, receipt content, or unnecessary personal data.
- **Release**: Build Java on Java 21 with Maven; run JUnit 5, integration and contract checks; publish immutable artifacts; deploy to staging and smoke-test before production promotion with rollback support. Human review of AI-generated design, code, tests, and diagrams is required.

Cloud provider/region, availability objectives, production load, and retention policies are unresolved and must be agreed before sizing production infrastructure.

## Architectural tradeoffs

- **Chosen**: One backend and relational source of truth minimize distributed state, allow direct balance derivation from approved records, and keep the first-release deployment and test topology manageable.
- **Accepted cost**: Backend modules scale and release together; boundaries need to remain clear so a future service extraction remains possible if justified.
- **Not selected for first release**: Independently deployed domain services, per-service databases, and a durable event broker. These add eventual consistency, replay/versioning, service observability, and operational work before the project has evidence it needs independent scaling.
- **Potential evolution**: If report volume materially slows transactional use cases, reconsider a separate reporting projection/service with explicit freshness and rebuild behavior.

## Requirement boundary

The architecture supports FR-001–FR-017 and FR-021–FR-022 through the shared backend and clients. FR-018–FR-020 and AC-010 require actual web, Android, and iOS clients in addition to the Swing MVP. Full-product platform conformance remains open until those clients are delivered and accepted. The complete acceptance mapping is in [final-requirements.md](./final-requirements.md).

