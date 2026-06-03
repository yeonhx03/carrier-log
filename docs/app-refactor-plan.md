# App.jsx Component Refactor Plan

## Goal

Reduce `src/App.jsx` from a 1,300-line state container into a small application
composition layer without changing user-visible behavior, Firebase document
shape, localStorage keys, export output, or Android native integrations.

## Splitting Principle

Split by state ownership and side-effect boundary, not by line count.

- A hook owns state that changes together and the actions that mutate it.
- Pure data transformation belongs in selector utilities.
- Existing screen components remain presentation-focused.
- `App.jsx` owns only top-level navigation, modal visibility, and composition.
- File size is a secondary guardrail. Do not replace one large `App.jsx` with
  a few equally large hooks.
- Do not introduce React Context until prop drilling remains a real problem
  after the hooks are extracted.
- Do not change storage schemas or rename persisted keys during this refactor.

## File Size Guardrails

Use responsibility boundaries first, then review the resulting file sizes.

- Presentation component: target 200 lines or fewer
- Custom hook: target 250 lines or fewer
- Pure utility or selector file: target 200 lines or fewer
- Any file over 300 lines requires an explicit second-split review
- `App.jsx`: target approximately 250 to 400 lines

These are review thresholds, not reasons to create artificial one-function
files. A file may exceed a target only when splitting it would obscure a single
cohesive responsibility.

If a domain hook grows too large, split it again by its internal responsibility:

- Large `useAppData`:
  - localStorage helpers in `appDataStorage.js`
  - Firestore synchronization in `useCloudAppData.js`
  - defaults and normalization in `appDataDefaults.js`
- Large `useSettlementController`:
  - account-list behavior in `useSettlementAccounts.js`
  - request behavior in `useSettlementRequests.js`
  - file generation orchestration in `useSettlementExport.js`
- Large `useHistoryController`:
  - search and grouping selectors remain outside React hooks
  - log mutation behavior may move to `useLogActions.js`

## Target Structure

```text
src/
  App.jsx
  hooks/
    useAppData.js
    useAuthAccount.js
    useHistoryController.js
    useExportController.js
    useSettlementController.js
    useSettingsController.js
  utils/
    appDataStorage.js
    historySelectors.js
    logSelectors.js
```

## Responsibility Boundaries

### `useAppData`

Owns the persisted user data model:

- `companies`
- `noteCategories`
- `logs`
- `settlementAccounts`
- `settlementAccountTemplates`
- `settlementFixedDeduction`
- `settlementRequestTemplates`
- localStorage initialization and persistence
- Firestore subscription and debounced save
- cloud data application guards
- resetting all user data after account deletion

This hook is the only place that knows the complete `appData` document shape.

### `useAuthAccount`

Owns authentication and account lifecycle:

- `firebaseUser`
- `isLocalOnlyMode`
- auth loading and error states
- Google sign-in
- local-only start
- sign-out
- Google reauthentication
- account and cloud data deletion flow

It receives a `resetUserData` callback and does not directly mutate logs,
companies, or settlement state.

### `useHistoryController`

Owns history UI state and log editing flow:

- selected month
- search open state, type, and query
- selected company group
- selected log
- edit mode
- opening and closing history views
- add, update, and delete log actions

Pure grouping, filtering, month extraction, and company-name resolution move to
`historySelectors.js` and `logSelectors.js`.

### `useExportController`

Owns regular export workflow state and execution:

- export step
- selected month
- file format
- export mode
- selected company
- Excel/PDF generation orchestration

It consumes logs and companies but does not own them.

### `useSettlementController`

Owns settlement workflow state and execution:

- settlement month, format, and step
- request text
- settlement account editing
- saved account list operations
- request template operations
- settlement Excel/PDF generation orchestration

It consumes persisted settlement data setters from `useAppData`.

### `useSettingsController`

Owns settings modal and editable settings form state:

- settings open state and section
- new company input
- new note category inputs
- company add, rename, and delete
- note category add, rename, price update, and delete
- fixed deduction update

When a note category name changes, this controller updates affected logs through
an explicit callback from `useAppData`.

### `App.jsx`

After refactoring, `App.jsx` should:

- keep only the top-level `screen` state
- compose the hooks
- choose which screen component to render
- pass state and callbacks to screen components
- render `SettingsPanel`

Target size: approximately 250 to 400 lines.

After all extractions, review every new file against the file size guardrails
before considering the refactor complete.

## Execution Order

Perform the refactor in small behavior-preserving commits:

1. Extract storage helpers into `utils/appDataStorage.js`.
2. Extract pure history and log selectors with no React dependencies.
3. Extract `useAppData` and verify localStorage plus Firestore behavior.
4. Extract `useAuthAccount` and verify Google login, logout, local-only mode,
   and account deletion.
5. Extract `useHistoryController` and verify search, detail, edit, and delete.
6. Extract `useExportController` and verify Excel/PDF output.
7. Extract `useSettlementController` and verify accounts, requests, and files.
8. Extract `useSettingsController` and verify company and rate changes.
9. Reduce `App.jsx` to composition and remove dead imports.

## Verification Checklist

Run after every extraction:

```bash
npm run lint
npm run build
npx cap sync android
cd android
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew assembleDebug
```

Manually verify after the final extraction:

- Google login and logout
- local-only start
- Firestore load and save after app restart
- account and data deletion
- log add, search, detail, edit, and delete
- company rename updates displayed historical records
- note category rename updates existing logs
- regular Excel/PDF export
- settlement Excel/PDF export
- saved account lists and request templates

## Non-Goals

Do not combine this refactor with:

- UI redesign
- Firebase schema migration
- localStorage key changes
- export format changes
- routing library adoption
- TypeScript migration
- Context or state-management library adoption
