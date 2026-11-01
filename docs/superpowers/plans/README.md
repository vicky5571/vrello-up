# Plans Directory

Implementation plans for all features in vrello-up.

## Naming Convention

```
YYYY-MM-DD-<feature-slug>.md
```

## Required Sections (per plan)

1. File Manifest (table: phase, target, files, LOC delta)
2. Phased checkbox tracking (each phase has explicit checkboxes)
3. Checkpoints (verifiable command output per phase)
4. Sequencing Rules (dependency graph between phases)
5. Risks & Mitigations
6. Commit Convention (spec/plan refs)

## Pairing Rule

Every plan MUST have a matching spec file:
- Plan: `YYYY-MM-DD-<name>.md`
- Spec: `YYYY-MM-DD-<name>-design.md`

`npm run drift:check` enforces this pairing.

## Index

| Date | Feature | Phases | Status |
|---|---|---|---|
| 2026-09-07 | marcom-port | — | Done |
| 2026-09-14 | dual-context-mode | — | Done |
| 2026-09-14 | separate-content-and-field-events | — | Done |
| 2026-09-15 | google-drive-picker-integration | — | Done |
| 2026-09-15 | marcom-work-items-workspace-scoping | — | Done |
| 2026-09-17 | placement-maps | — | Done |
| 2026-09-19 | god-files-strangler-phase-1 | — | Done |
| 2026-09-20 | pipeline-view | — | Done |
| 2026-09-21 | draft-outlet-approval-flow | — | Done |
| 2026-09-21 | field-posm-execution | — | Done |
| 2026-09-21 | posm-quarterly-regional-reports | — | Done |
| 2026-09-21 | url-routing-and-state-sync | — | Done |
| 2026-10-01 | remove-outlet-tier-option-2a | — | Done |
| 2026-10-27 | remove-workspace-single-tenant | 22 phases | Done |
| 2026-10-29 | reports-view-improvements | 8 phases | Done |
| 2026-10-30 | auth-user-management | 22 phases | Done |
| 2026-10-30 | auth-user-management-fixes | 4 phases | Not Started |
| 2026-10-30 | inventory-system | 7 phases | Done |
| 2026-10-31 | event-card-equipment-indicator | 3 phases | Done |
| 2026-10-31 | qa-comprehensive-seeder | 7 phases | Done |
| 2026-11-01 | topnav-avatar-profile-sync | 4 phases | Done |
| 2026-11-01 | core-web-vitals-image-optimization | 6 phases | Done |
| 2026-11-01 | projects-work-item-create-modals | 6 phases | Done |
| 2026-11-01 | session-rbac-permissions-sync | 5 phases | Done |
