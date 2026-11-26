# 0009 — Use Gin and organize the school backend by feature

JTrax retains a single Go API service and SQLite database. Gin handles HTTP, and each school feature owns its workflows.

**Date** 2026-11-26 · **Status** Accepted

## Context

Maintainers need to trace a school operation from the request to its database effects while preserving the behavior that the existing admin, family, and mobile clients use.

## Decision

Register routes and middleware in Gin. Group handlers and workflows by school feature. Keep simple reads beside their handlers. For multi-step writes, use a transaction script in the owning feature. Payment voiding, for example, updates the payment, credits, enrolment, and audit trail in one transaction.

Keep standard resources on the shared registry-driven CRUD path described in [[0004-sqlite-and-generic-crud-backend]]. Register background jobs at server startup and keep each job's work with its feature.

## Consequences

The school still deploys one process. A maintainer changing a standard record starts at the registry, while a maintainer changing a payment rule starts in the payments package. Shared changes to sessions, row scopes, or response encoding affect several clients and need HTTP integration coverage.

The [backend maintainer guide](https://github.com/Kusk24/jtrax-backend#how-the-backend-is-organized) maps the packages. The implementation and compatibility checks are recorded in backend PRs [123](https://github.com/Kusk24/jtrax-backend/pull/123) through [133](https://github.com/Kusk24/jtrax-backend/pull/133).

Related to [[0003-backend-switched-to-golang]] and [[jtrax-on-lightsail]].

#decision #backend
