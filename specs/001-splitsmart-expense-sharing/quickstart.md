# SplitSmart Architecture Validation Guide

This guide defines validation scenarios for implementation of the architecture in [plan.md](./plan.md). The repository currently contains planning artifacts rather than the application modules; therefore the Maven commands below become runnable after those modules and their Maven wrapper/build files are implemented. This document does not claim that the application already runs.

## Prerequisites for implementation

- Java 21 JDK and Maven (or the repository's Maven Wrapper, if added).
- A test relational database and private test object-storage configuration for integration scenarios.
- Test email adapter/provider that does not send production mail.
- Two or more test accounts with separate group roles.

## Build and automated verification

From the implementation repository root, run:

```powershell
mvn -B verify
```

Expected result: Java sources compile targeting Java 21; JUnit 5 tests run; integration/contract checks pass; Maven exits successfully. A failure is not acceptance, even if a GUI can be opened.

For a focused test run after test classes are added, use Maven Surefire's test selector, for example:

```powershell
mvn -B -Dtest=ExpenseAllocationTest,ApprovalPolicyTest,PaymentServiceTest test
```

Expected result: allocation reconciliation, approval gating, and payment idempotency/overpayment boundary tests all pass.

## End-to-end acceptance scenarios

1. **Submit and split an expense**: Create a group with at least three members. Submit a positive expense using equal split, with the payer excluded from participants. Verify one pending expense is returned, its shares reconcile exactly to the total, and no balance changes.
2. **Percentage rounding**: Submit a valid percentage split whose currency-minor-unit allocation requires rounding. Verify input precision and 100% total are enforced and largest-remainder shares add exactly to the expense total. Verify invalid percentage precision and total are rejected without persisting an expense.
3. **Receipt privacy**: Attach an image, retrieve it as a group member, then attempt retrieval as a non-member. Verify authorized access succeeds and unauthorized access is denied.
4. **Review and balance**: Have a designated, non-submitting approver approve the expense. Verify it affects balances only when the configured policy is satisfied. Verify a submitter's approval attempt and a non-approver's attempt are rejected. Verify rejected expenses do not affect balances.
5. **Notification reliability**: Submit an expense with the email adapter unavailable. Verify expense state remains pending and balance remains unchanged; restore the adapter and verify pending outbox work is retried and notifications go only to other group members.
6. **Payment recording**: Record a completed partial external payment and retry the request with its idempotency key. Verify history and balance reflect one payment only. Attempt an overpayment and verify it is rejected and no transfer service is called.
7. **Reports and authorization**: Request a valid date-range report as a member and verify only matching authorized records are included. Verify a reversed date range is rejected and a valid empty range returns no records.
8. **Platform consistency**: When web, Android, and iOS clients are delivered, execute the supported workflows against the same test group and verify the backend's account, expense, approval, balance, and payment state is consistent. The Swing MVP alone does not pass this scenario.
9. **Performance**: After the action set, operating load, environment, and measurement method are agreed, measure common actions and verify the agreed NFR-003 threshold (95% within 2 seconds).

## Requirement references

These scenarios correspond to AC-001–AC-011 in [spec.md](./spec.md). The endpoint and error boundary is described in [contracts/api-contract.md](./contracts/api-contract.md), and entity invariants in [data-model.md](./data-model.md).
