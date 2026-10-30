<!--
Sync Impact Report
Version change: uninitialized template -> 1.0.0
Modified principles: None; this is the initial adoption.
Added sections: Ten engineering principles; Customer Requirements and Implementation Decisions;
	Verification Workflow; Governance rules.
Removed sections: None; scaffold placeholders and examples were replaced.
-->
# SplitSmart Constitution

## Core Principles

### 1. Java 21 Baseline
Production Java code MUST target Java 21. Builds and reviews MUST detect language or runtime
features that exceed this baseline so that the supported runtime remains predictable.

### 2. Maven Build
Maven MUST be the canonical build and dependency-management system. The project MUST declare
build configuration and dependencies in its Maven project files, and changes MUST be verifiable
with the documented Maven lifecycle.

### 3. Java Swing Desktop Interface
The desktop GUI MUST use Java Swing. Swing event handling and UI updates MUST follow Swing's
event-dispatch-thread rules. Swing is a desktop implementation choice, not a substitute for
other customer-requested platform targets.

### 4. JUnit 5 Verification
Automated Java tests MUST use JUnit 5. Tests MUST cover business rules and important boundary
conditions; changes to expense, split, balance, or payment behavior MUST include relevant tests.

### 5. PlantUML Architecture Diagrams
Architecture and interaction diagrams maintained for the project MUST use PlantUML source. A
diagram MUST be updated when a change materially alters the architecture or a documented flow;
diagrams explain design and do not replace requirements or executable verification.

### 6. Object-Oriented Design
Code MUST use cohesive types with explicit responsibilities, encapsulated state, and behavior
owned by the abstractions responsible for it. Inheritance and design patterns MUST be used only
when they clarify a real domain or substitution relationship.

### 7. GUI and Business Logic Separation
Business rules MUST reside outside Swing components and event listeners. GUI code MUST delegate
user actions to application or domain logic through defined interfaces, allowing business behavior
to be tested without constructing or displaying the GUI.

### 8. BigDecimal for Money
Amounts, rates, allocations, and monetary calculations MUST use `BigDecimal`, never binary
floating-point types. Rounding scale and mode MUST be explicit at each business-rule boundary
where rounding is required.

### 9. Requirement Traceability
Each customer requirement MUST be traceable from its source to the design and verification that
addresses it. Customer-requested behavior MUST be distinguished in project artifacts from
implementation decisions; implementation choices MUST NOT silently redefine or waive customer
requirements. Changes or gaps affecting customer outcomes MUST be documented and reviewed.

### 10. Human Review of AI Output
AI-generated code, tests, documentation, and diagrams MUST receive human review before acceptance.
Reviewers MUST verify correctness, consistency with requirements and this constitution, and
relevant test results; AI output alone is not evidence of correctness.

## Customer Requirements and Implementation Decisions

`UserRequirement.md` is the recorded source of customer requirements. It requests, among other
things, a primarily web-based product and applications for Android and iOS. The Java 21, Maven,
Swing, JUnit 5, PlantUML, design, and review rules in this constitution are implementation
decisions, not statements made by the customer. In particular, a Swing desktop interface does
not by itself meet the requested web and mobile platform coverage. Any platform gap or proposed
change to customer outcomes MUST be made explicit in traceability records and reviewed; it MUST
NOT be silently treated as resolved by an implementation choice.

## Verification Workflow

Changes MUST identify affected customer requirements and implementation decisions. Maven builds
and relevant JUnit 5 tests MUST be run for changes to code; test results and any unverified
requirements MUST be reported during review. Architecture changes MUST include corresponding
PlantUML updates. Review MUST verify monetary arithmetic uses `BigDecimal`, and GUI changes MUST
keep business rules outside Swing components.

## Governance

This constitution governs engineering and review decisions. Customer requirements remain grounded
in their recorded source and MUST NOT be overwritten by implementation constraints. Amendments
MUST document their rationale, scope, affected principles, and impact on existing work; a project
maintainer MUST review and approve amendments before they take effect.

Constitution versions use Semantic Versioning: MAJOR for backward-incompatible governance changes
or removal/redefinition of a principle, MINOR for a new principle or materially expanded guidance,
and PATCH for clarifications and non-semantic corrections. Reviews MUST check affected work for
compliance with this constitution and record justified exceptions and follow-up actions.

**Version**: 1.0.0 | **Ratified**: 2026-10-29 | **Last Amended**: 2026-10-29
