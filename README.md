# Band Manager Pro

Transparent money management for a band with a rotating lineup: track event income and
expenses, split payouts fairly, recover shared yearly costs, and settle up at year end —
all offline-first on iOS and Android.

Built for a Kirtan singing circle in Switzerland, but the domain model is generic enough
to fit any band or ensemble.

## Stack

- **Expo SDK 54** + **React Native** + **TypeScript** (strict) — pinned to match whatever
  SDK version your Expo Go client actually supports; see "Expo Go version mismatches" below
- **expo-router** — file-based navigation, bottom tabs + pushed event detail
- **Zustand** — state management, persisted through a repository abstraction
- **Supabase** — optional cloud sync (Postgres + Auth), so a whole band shares one dataset
  across devices; falls back to **AsyncStorage**-only (offline, single-device) when not
  configured — see "Cloud sync" below
- **react-native-reanimated** + **react-native-gesture-handler** — sheet animations, layout
  transitions, swipe-to-delete
- **Jest** — full unit coverage of the money-math domain layer

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your iPhone/Android device, or press `i` / `a` in the
terminal for a simulator/emulator.

### Expo Go version mismatches

Expo Go only supports one (sometimes two) SDK version(s) at a time, and the App Store
build occasionally lags behind what `expo.dev` lists as "latest." If you see *"Project is
incompatible with this version of Expo Go,"* check what SDK your installed Expo Go client
reports and align the project to it:

```bash
npm install expo@<matching-major>
npx expo install --fix
npm install   # re-resolve @react-native/jest-preset / jest-expo / typescript by hand if
              # expo install --fix didn't touch them — versions must match react-native's
```

## Testing

```bash
npm test
```

31 tests cover the full event balance waterfall, the shared-cost pot, annual report
aggregation, data/schema migration, the offline-cache fallback, and CSV export — including
edge cases (zero members, zero events, negative net payout, an empty pot, a zero
contribution setting, and a failed cloud sync).

## Domain rules

**Shared cost pot** — recurring/equipment costs are amortized across events:

- Every purchase is added to a shared **pot** (its outstanding balance).
- Each **new event contributes a fixed CHF amount** (configurable, default 50) to the
  pot — capped at what's still outstanding, so contributions stop automatically once
  the pot is settled.
- The contribution is **locked in when the event is created**. Purchases added later
  grow the pot and extend the runway, but **never change past events** — important
  because events are paid out right after they happen.

**Event balance sheet** (waterfall, in this exact order):

1. Income
2. − Expenses
3. − Shared cost pot contribution (locked in at event creation)
4. = Subtotal
5. − Donation — **10% of income**, deducted before member payout
6. − Admin work compensation — **CHF 20/hour** (`ADMIN_HOURLY_RATE` in
   `src/domain/constants.ts`)
7. = **Net payout**, split equally among participating members

**Annual report** per member = Σ performance payouts + Σ admin compensation + Σ yearly-cost
reimbursements (for items they personally paid for and get reimbursed).

All of this lives in `src/domain/calc.ts` as pure, framework-free functions — no React,
no storage, no side effects — so it's fully testable and the one place to check if a
number ever looks wrong.

## Architecture

```
app/                      expo-router routes (file-based)
  _layout.tsx              root: theme, safe area, gesture handler, hydration gate
  (tabs)/                  bottom tab group
    index.tsx               Overview
    events.tsx               Events list
    band.tsx                 Band members
    yearly.tsx                Yearly costs
    report.tsx                Annual report + CSV export
  event/[id].tsx            Event detail (pushed screen, tab bar hidden)

src/
  domain/                  pure calculation logic + types — the source of truth for money
    calc.ts / calc.test.ts
    constants.ts             ADMIN_HOURLY_RATE, DONATION_RATE, storage key, etc.
    format.ts                fmtCHF, uid, todayISO
  store/
    repository.ts            DataRepository interface (load/save)
    asyncStorageRepository.ts   v1 implementation
    useStore.ts               Zustand store; actions + auto-persist on change
  theme/                   design tokens, dark/light palettes, ThemeProvider
  components/              design system: Card, Button, TextField, SelectField, Sheet,
                            Chip, Row, EmptyState, ProgressBar, AnimatedNumber, Skeleton,
                            SwipeableRow, Screen, BackgroundGlow
  sheets/                  one bottom-sheet form per data-entry flow (income, expense,
                            admin work, new event, yearly cost item)
  hooks/                   memoized selectors combining the store with domain/calc.ts
  lib/supabase.ts          Supabase client (no-ops gracefully if unconfigured)
  screens/                 SignInScreen, BandSetupScreen — auth/band UI, not routed
```

### Storage is swappable

`DataRepository` (`src/store/repository.ts`) is the only thing the store talks to for
persistence — `load()` / `save()` on the whole `AppData` blob. `useStore.hydrate(repository?)`
decides which one is active; not passing one re-hydrates from whatever's already active
(that's what pull-to-refresh does). Three implementations exist today:

- `asyncStorageRepository.ts` — local-only, used when Supabase isn't configured or the
  user taps "skip" on sign-in
- `supabaseRepository.ts` — `createSupabaseRepository(bandId)`, a whole-blob upsert against
  the `band_data` table for one band
- `cachedCloudRepository.ts` — `withOfflineCache(cloud)` wraps any cloud repository with an
  AsyncStorage cache: reads prefer the cloud but fall back to the last sync when offline;
  writes always land locally first, then best-effort push to the cloud

## Cloud sync (Supabase)

A whole band can share one dataset across every member's phone instead of each device
having its own isolated copy. This is **optional** — without `.env.local` configured
(see below), the app behaves exactly like v1: local-only, no sign-in, no network calls.

### How it works

1. **Sign in** with an email + one-time 6-digit code (no passwords, no magic-link deep
   linking to configure).
2. **Create a band** (becomes its first member) or **join one** with an invite code from a
   bandmate — shown and shareable from the Band tab once synced.
3. All app data for that band lives in one `band_data.data` JSON column in Postgres —
   the exact same `AppData` shape the local repository already used, so no screen or
   domain-logic change was needed to add this.
4. **Row-Level Security** restricts every table to members of that specific band
   (`supabase/migrations/20260709150000_bands_and_data.sql`); creating/joining a band goes
   through `SECURITY DEFINER` Postgres functions (`create_band`, `join_band_by_code`)
   since there's no membership row to check against yet at that exact moment.
5. Sync is **whole-blob, last-write-wins** — simple and fine for a handful of people who
   rarely edit at the exact same second. It is *not* conflict-safe for true simultaneous
   edits; a future upgrade path is per-row realtime writes instead of one JSON blob per band.

### Setting it up yourself

```bash
npm install -g supabase   # if you don't have it
supabase login
supabase projects create band-manager-pro --org-id <your-org-id> --region eu-central-1 --db-password <generate one>
supabase link --project-ref <project-ref>
supabase db push --linked   # applies supabase/migrations/*.sql
```

Then create `.env.local` (gitignored — never commit real keys) in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<the publishable/anon key from the Supabase dashboard>
```

Both are safe to embed client-side by design (that's what Row-Level Security is for) — but
still keep `.env.local` out of git so your project ref isn't casually public. For EAS
builds, set the same two as EAS secrets/env vars rather than relying on a local file.

## Product decisions (undocumented in the brief, decided here)

- **Date fields are plain `YYYY-MM-DD` text inputs**, not a native date picker. Keeps the
  app dependency-light and fully Expo-Go compatible; a `@react-native-community/datetimepicker`
  swap is straightforward later if wanted.
- **Icons**: `@expo/vector-icons` (Ionicons, outline style) instead of the web-only
  `lucide-react` used in the original mockup — closest visual match available natively.
- **Event detail is a pushed stack screen** outside the tab group (not nested in the
  Events tab), per the brief — this hides the tab bar and gives a native push transition.
- **Swipe-to-delete confirmation**: swiping reveals a delete affordance; tapping it opens
  a native `Alert.alert` confirm before anything is actually deleted. Nothing is ever
  removed on a bare swipe.
- **CSV export** uses the modern class-based `expo-file-system` API
  (`new File(Paths.cache, ...)`) + `expo-sharing`, since the legacy
  `FileSystem.writeAsStringAsync` throws at runtime on this SDK.
- **Light mode**: the token/palette architecture supports it automatically via
  `useColorScheme()` (see `src/theme/palette.ts`), but only the dark theme — the explicit,
  primary ask — has been visually tuned and tested.
- **`AnimatedNumber`** interpolates a Reanimated shared value and mirrors it into React
  state via `useAnimatedReaction`, rather than driving a native `TextInput` prop directly.
  Simpler, and plenty smooth for balances that update a few times a second at most.

## EAS Build

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile development     # simulator/dev-client build
eas build --platform ios --profile production
eas build --platform android --profile production
```

Profiles are pre-configured in `eas.json` (`development`, `preview`, `production`). No
extra native configuration is required — the app only uses config-plugin-free Expo SDK
packages plus `expo-router`, `expo-sharing`, and `expo-status-bar`, which are already
registered as plugins in `app.json`.
