# CareerBOT Mobile

React Native + Expo client for CareerBOT. iOS + Android.

## Stack

- **Framework:** React Native 0.76 + Expo SDK 52 (managed workflow)
- **Routing:** Expo Router (file-based)
- **State:** Zustand (client) + TanStack Query (server)
- **TypeScript:** strict mode, no `any`

## Quick start

```bash
pnpm install                # or: npm install
npx expo install --fix      # pin Expo-validated dependency versions
pnpm start                  # opens Metro
pnpm ios                    # iOS simulator
pnpm android                # Android emulator
```

## Build & submit

```bash
eas build --profile development --platform all     # internal dev build
eas build --profile preview --platform all         # internal stakeholder
eas build --profile production --platform all      # store-submission build

eas submit --profile production --platform ios     # → TestFlight
eas submit --profile production --platform android # → Play Console
```

## Documentation

The canonical architecture + execution docs live in the careerbot-web repo at
`reviews/mobile/` — they are the single source of truth for this project.

- Architecture blueprint: `reviews/MOBILE_ARCHITECTURE_BLUEPRINT.md`
- Phase-by-phase playbook: `reviews/mobile/04_PHASE_PLAYBOOK.md`
- Per-PR checklists: `reviews/mobile/07_CHECKLISTS.md`
- Backend coordination: `reviews/mobile/01_BACKEND_COORDINATION_A0_A6.md`
- Compliance map (GDPR + CCPA + DPDP): `reviews/mobile/02_COMPLIANCE_GDPR_CCPA_DPDP.md`
- Migration governance (port-vs-rewrite): `reviews/mobile/08_MIGRATION_GOVERNANCE.md`
- Migration ledger: `MIGRATION_LEDGER.md` (in THIS repo)

## Contributing

See `CONTRIBUTING.md`.
