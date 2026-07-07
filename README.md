# Band Manager Pro

Transparent money management for a band with a rotating lineup: track event income and
expenses, split payouts fairly, recover shared yearly costs, and settle up at year end —
all offline-first on iOS and Android.

Built for a Kirtan singing circle in Switzerland, but the domain model is generic enough
to fit any band or ensemble.

## Stack

- **Expo SDK 57** + **React Native** + **TypeScript** (strict)
- **expo-router** — file-based navigation, bottom tabs + pushed event detail
- **Zustand** — state management, persisted through a repository abstraction
- **AsyncStorage** — offline-first storage (v1); swappable for cloud sync later
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

## Testing

```bash
npm test
```

17 tests cover the full event balance waterfall, yearly-cost sharing, annual report
aggregation, and CSV export — including edge cases (zero members, zero events, negative
net payout, divide-by-zero on the yearly distribution setting).

## Domain rules

**Event balance sheet** (waterfall, in this exact order):

1. Income
2. − Expenses
3. − Yearly cost share (`total yearly costs / distribute-over-N-events`)
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
```

### Storage is swappable

`DataRepository` (`src/store/repository.ts`) is the only thing the store talks to for
persistence. `asyncStorageRepository.ts` is the offline v1 implementation. To add cloud
sync later, implement the same interface (e.g. `SupabaseRepository`) and swap it in
`useStore.ts` — no changes needed anywhere else, including every screen and sheet.

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
- **CSV export** uses the SDK 57 class-based `expo-file-system` API
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
