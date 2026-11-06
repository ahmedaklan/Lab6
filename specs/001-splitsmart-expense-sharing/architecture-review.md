# SplitSmart architecture review
CIS 285 · Lab 7 · ChatGPT review

**Recommendation:** Use the base architecture for the first release. A single backend can check approvals and calculate balances from the same records. The separate notification worker already handles the slow task of sending email. Production traffic and team size are still open, so the project has no established need to deploy every feature independently.

| Review question | Base plan — modular Java backend | Alternative — event-driven services |
|---|---|---|
| What happens when an expense is submitted? | One database transaction saves the pending expense, its shares, and a work item for notifications. A worker sends notifications later. | Expense Service saves the pending expense and an outgoing event together. Approval and Notification Services consume the event separately. |
| When does the balance change? | A balance query reads approved allocations and completed payments from the shared database. | Balance Service updates its own records after receiving an approval event. Until then, a user can see an approved expense and an older balance. |
| What needs testing? | JUnit 5 can test rounding, approval rules, and payment limits. Integration tests should cover database rollback and notification retries. | The same business tests apply. Also replay an approval event twice and stop and restart a consumer to verify that the balance updates exactly once. |
| What needs deploying? | A Java API and notification worker, a relational database, private receipt storage, and email delivery. | Multiple Java services, isolated data stores or schemas, and a durable message broker. Each service can be released separately, but failed messages and delayed updates need monitoring. |
| How well do the diagrams explain the design? | The class diagram connects users, payments, and expenses. The activity diagram stops after notifications. Add the approval decision to show when balances may change. | The diagrams show service ownership and the approval event. The activity diagram rejoins the notification and approval paths before review. Revise it so an email outage cannot delay approval. |

## Checks for the final design

- **Expense split and approval.** Submit a $10.00 expense split equally among three members. The shares must total $10.00. Record which member gets the extra cent when remainders tie. Verify that pending and rejected expenses contribute zero to balances.
- **Concurrent payments.** If $20 is owed and two $15 payments arrive together, only one can be accepted. Specify how the balance check and payment write are protected together. In the alternative, also explain how payment validation handles a delayed balance update.
- **Platform coverage.** Both designs plan for Swing, web, Android, and iOS. Keep separate acceptance checks for the three required full-product clients. A working Swing demo proves only the desktop workflow.

**When the alternative makes sense:** If reporting volume grows enough to slow other features, an independently deployed reporting service could process its own copy of the data. That benefit would justify reconsidering the extra deployment and testing work.

**Documents reviewed:** `plan.md` and `alternative-architecture.md`. Findings evaluate the proposed designs. Implementation and test execution are outside this review.
