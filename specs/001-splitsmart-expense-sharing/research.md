# Architecture Research and Decisions

This document records architecture recommendations derived from [spec.md](./spec.md) and the project [constitution](../../.specify/memory/constitution.md). These are implementation decisions, not additional customer requirements. No external technology was mandated beyond the constitution's Java 21, Maven, Swing, JUnit 5, and PlantUML rules.

## Shared application backend

- **Decision**: Use a modular Java 21 backend behind a versioned HTTPS API, shared by the Swing MVP and the planned full-product clients.
- **Rationale**: A shared authoritative service supports consistent accounts, groups, approvals, balances, and payments across clients and keeps business logic outside the GUI.
- **Alternatives considered**: A Swing-only local application would be simpler for an isolated desktop MVP but cannot supply the specified primarily web, Android, and iOS experiences or shared cross-device state. Separate independent backends per client risk inconsistent rules and records.
- **Traceability**: FR-002, FR-018–FR-020, NFR-001, NFR-006, AC-001, AC-010.

## Modular monolith before service decomposition

- **Decision**: Start with one modular API service and a separately deployable notification worker; maintain clear API, application, domain, and infrastructure boundaries.
- **Rationale**: This supports transactionally consistent expense submission and approval while keeping deployment and operations simpler than a distributed set of services. The worker isolates slow/retryable delivery from request processing.
- **Alternatives considered**: Synchronous email delivery couples user requests to an external provider and can make notification failures affect usability. Microservices add operational and consistency overhead without a stated scale requirement.
- **Traceability**: FR-010–FR-013, NFR-003–NFR-005, AC-006–AC-007.

## Transactional persistence and asynchronous notification

- **Decision**: Store domain records in a relational database; write an outbox record in the same transaction as a pending expense, then deliver in-app and email notifications asynchronously.
- **Rationale**: Expense submission and notification intent cannot be separated by a crash between two writes; an outbox permits retry without approving an expense or losing its state.
- **Alternatives considered**: Directly sending before commit can notify about an expense that failed to save. Sending synchronously after commit can lose notification work if the process stops. A separate broker may be introduced if scale requires it, but is not assumed for the baseline.
- **Traceability**: FR-010–FR-013, NFR-004, AC-006–AC-007, notification delivery edge case.

## Monetary allocation and balance authority

- **Decision**: Use `BigDecimal` for all money and percentage computations, explicitly quantize allocations to the currency minor unit using the spec's largest-remainder rule, and treat persisted approved allocations and completed payment records as balance inputs.
- **Rationale**: This prevents binary floating-point error, reconciles each split exactly to the expense total, and excludes pending/rejected expenses by construction.
- **Alternatives considered**: Binary floating point can introduce unrepresentable currency fractions. Independently rounding every share may produce a total that differs from the original amount. Updating balances from every submitted expense violates the review requirement.
- **Traceability**: FR-005–FR-008, FR-011–FR-015, NFR-002, NFR-004–NFR-005, AC-003–AC-008.

## Private receipt storage

- **Decision**: Keep receipt image bytes in private object storage and store metadata plus an opaque object key with the expense record. Authorize every access and use short-lived access URLs or an authorized download proxy.
- **Rationale**: Image data can be served efficiently without making group receipts public; authorization remains tied to group membership.
- **Alternatives considered**: Public object URLs do not enforce membership. Storing large image bytes directly in ordinary expense rows increases database load and complicates backups.
- **Traceability**: FR-009, NFR-001, AC-005.

## Client-platform boundary

- **Decision**: Keep the backend contract client-neutral. Use Swing for the Java 21 MVP and plan separate web, Android, and iOS clients against the same API. Do not select web/mobile frameworks in this baseline.
- **Rationale**: The constitution mandates Swing as a desktop implementation choice, while the spec explicitly says Swing does not meet full-product platform requirements. Avoiding unapproved client stack choices keeps the plan aligned without treating the gap as resolved.
- **Alternatives considered**: Claiming Swing as the full product contradicts FR-018–FR-020 and AC-010. Choosing specific web/mobile technologies without product direction would be speculative.
- **Traceability**: FR-018–FR-020, AC-010, SC-006. Delivery sequence is open question 1 in the spec.

## Deployment topology

- **Decision**: Recommend a stateless hosted Java API, an independently scalable notification worker, managed relational storage, private object storage, HTTPS edge, secret management, and replaceable email-provider adapter.
- **Rationale**: This aligns deployment boundaries with request processing, retryable delivery, transactional records, and private image content; provider choices can be finalized when region, load, and service objectives are known.
- **Alternatives considered**: Embedding database credentials and persistence in desktop clients makes authorization and updates difficult to control. A single all-in-one local installation does not provide cross-platform shared state.
- **Traceability**: FR-002, FR-009–FR-010, NFR-001, NFR-003, NFR-006.

## Decisions requiring product or operations confirmation

These are not silently resolved by this architecture:

1. Delivery order and acceptance dates for the primary web product and Android/iOS applications alongside the Swing MVP (spec open question 1).
2. Supported currencies and their minor-unit metadata (spec open question 2). The design requires currency-aware quantization but does not choose a currency list.
3. Usability measurement protocol and population (SC-001).
4. Performance action set, agreed operating load, and measurement environment (NFR-003, SC-004).
5. Hosting vendor/region, production availability objectives, receipt size/retention, and data retention.

## Constitution gate

The recommendations follow Java 21, Maven, Swing for the desktop MVP, JUnit 5, PlantUML, separation of GUI and business logic, `BigDecimal`, and human review. Full-platform conformance remains an explicit delivery gap until the web, Android, and iOS clients are provided and accepted.
