# ExpenseFlow (Mobile)

React Native CLI + TypeScript app for ExpenseFlow — a personal finance tracker. Pairs with the API in [`../backend`](../backend).

## Quick start

```bash
npm install
cd ios && bundle exec pod install && cd ..

npm start              # Metro
npm run ios            # or: npm run android
```

The app expects the backend on `http://localhost:8000/api/v1` (iOS simulator) or `http://10.0.2.2:8000/api/v1` (Android emulator) in dev — see [src/constants/config.ts](src/constants/config.ts). Start the backend first (see [../backend/README.md](../backend/README.md)).

## Architecture

Feature-based clean architecture:

```
src/
  app/store.ts          Redux store (auth slice + RTK Query api)
  navigation/            AuthStack, MainTabs, per-feature stacks, RootNavigator
  features/
    auth/                screens, authSlice (session), authApi (RTK Query)
    dashboard/            screen, dashboardApi, chart wiring
    expenses/             list/form/detail screens, expensesApi
    income/                list/form screens, incomeApi
    settings/              screen (theme toggle, logout)
  components/            shared UI: Button, Card, Input, Chip, BottomSheet, Skeleton,
                          EmptyState, Fab, SwipeableRow, TransactionRow, charts/*
  theme/                  design tokens (tokens.ts) + ThemeProvider (light/dark)
  api/baseApi.ts          RTK Query base with silent refresh-on-401 (mutex-guarded)
  storage/mmkv.ts         token + settings persistence
  hooks/, utils/, types/, constants/
```

### Conventions

- **State**: server state lives in RTK Query (cache, refetch, invalidation tags); `authSlice` only holds the current user + `isAuthenticated`. `RootNavigator` swaps `AuthStack`/`MainTabs` purely off `isAuthenticated` — no manual `navigate()` calls on login/logout.
- **Auth persistence**: access + refresh tokens live in MMKV (`storage/mmkv.ts`); `baseApi.ts` attaches the access token to every request and silently refreshes-and-retries once on a 401, ending the session if refresh fails.
- **Theme**: all colors/spacing/typography come from `theme/tokens.ts` (validated chart palette — see `docs/design-system.md`); components read them via `useTheme()`, never hard-coded hex.
- **Lists**: `FlatList` with pagination (`onEndReached`) and `RefreshControl`; every list has a loading (skeleton), error, and empty state.
- **Swipe actions**: `components/SwipeableRow.tsx` is a small custom Reanimated pan-gesture row — `react-native-gesture-handler` v3 doesn't yet publicly re-export a `Swipeable` component.

## Testing

```bash
npm test
```

## Roadmap

EMI, Credit Card, Loan, Budget, Savings Goals, Bills, Reports, Calendar, global search, notifications, OCR, biometrics/PIN, and full offline sync are designed for but not yet built — see [../docs/ROADMAP.md](../docs/ROADMAP.md). The dashboard summary already reserves response fields for EMI/credit-card/loan/savings so those screens can land without an API contract change.
