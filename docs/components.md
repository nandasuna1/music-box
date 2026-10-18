# Components and UI layer

The presentation layer is implemented in React Native and routed by Expo
Router. The interface is primarily Portuguese, uses album artwork as a
prominent visual element, and combines dark surfaces with white text and
record-gold accents.

## User-facing features

- Google account sign-in and sign-out.
- Browse Deezer chart albums with infinite pagination.
- Search the album catalog after at least two characters are entered.
- Open album details, including artwork, artist, release date, and tracks.
- Rate an album from 1 to 5 and optionally add a comment.
- Save an album to a listen-later list.
- View profile information, review/listen-later counts, recent reviews, and
  saved albums.

## Navigation and screens

Parenthesized folders are Expo Router route groups: they organize navigation
without adding those group names to the URL.

| Route                         | Screen and responsibility                                 |
| ----------------------------- | --------------------------------------------------------- |
| `/(auth)/login`               | Google sign-in screen                                     |
| `/(protected)/(tabs)`         | Authenticated tab navigator                               |
| `/(protected)/(tabs)/`        | Album chart, paginated discovery, and search              |
| `/(protected)/(tabs)/profile` | Profile, reviews, saved albums, avatar picker, and logout |
| `/(protected)/album/[id]`     | Album detail, review summary, save action, and track list |
| `/(protected)/album/rate`     | Modal for creating or updating an album rating            |

## Shared components

| Component/module                                           | Responsibility                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `components/Button.tsx`                                    | Shared primary, secondary, and danger action with disabled/loading states |
| `components/TextField.tsx`                                 | Controlled text input with focused, disabled, and error presentation      |
| `components/GoogleLoginButton.tsx`                         | Presents the Google sign-in action using the shared button                |
| `components/SearchBar.tsx`                                 | Controlled album-search input using the shared text field                 |
| `components/RatingInput.tsx`                               | Displays and captures a rating; supports a disabled state                 |
| `components/Loading.tsx`                                   | Shared loading presentation                                               |
| `components/profileComponents.tsx`                         | Profile header, statistics, review cards, and labeled saved-album cards   |
| `components/themed-text.tsx`, `components/themed-view.tsx` | Theme-aware text and view primitives                                      |
| `components/haptic-tab.tsx`                                | Tab interaction with haptic feedback                                      |
| `components/ui/icon-symbol*.tsx`                           | Platform-aware tab/action icons                                           |

## Visual tokens and control contracts

`constants/theme.ts` exports `DesignTokens` for app feature surfaces. Its
semantic colors cover the dark background and elevated surfaces, primary and
muted text, gold accent, border, danger, and disabled states. The same export
provides spacing, typography sizes and line heights, named `fontWeight`
values, common control/avatar/artwork/icon dimensions, corner radii, card
elevation, and basic interaction-state values. Existing `Colors` and `Fonts`
exports remain for theme-aware template components.

Use these tokens instead of adding new one-off colors or spacing values when
styling the app's dark/gold feature UI. The tokens do not currently implement
a light-mode redesign. Fixed semantic dimensions (such as avatar and artwork
sizes) use `DesignTokens.sizing`; responsive percentages, full-width artwork,
and computed icon dimensions remain layout-specific. `marginTop: "auto"` is
kept where it expresses flex layout rather than a spacing value.

- `Button` takes string children and an `onPress` handler. `variant` selects
  `primary` (gold), `secondary` (raised dark surface), or `danger`; `disabled`
  blocks presses, while `loading` also blocks presses and can show a
  `loadingText`. A pressed primary action uses a darker gold; disabled/loading
  actions use the shared muted state.
- `TextField` is controlled through `value` and `onChangeText`. Optional
  `disabled` prevents editing; optional `error` presents an error border and
  message. Standard `TextInput` props remain available.
- `SearchBar` keeps its controlled `value`/`onChange` API and delegates visual
  input behavior to `TextField`.
- `RatingInput` keeps its existing `value`, `onChange`, and `size` API and
  accepts `disabled` to prevent changes while visually indicating the state.
- Saved-album cards display the cover, album title, and artist; if loading
  fails, the profile offers a retry action instead of leaving the error
  without recovery.

These are visual and interaction contracts, not a substitute for W2's
accessibility semantics and device verification.

## State ownership

TanStack Query manages server-backed state and caching. Query keys are scoped
by entities such as album, user, or search term. Review writes update the
current album-review cache and invalidate the user's recent reviews and
profile. Saving an album updates local query cache and invalidates the profile.

Local state is used for transient values such as the home search string,
rating-form inputs, and the profile screen's selected avatar preview. There is
no separate app-wide store currently used, despite Zustand being listed as a
dependency.

## Source layout

```text
app/                   Expo Router layouts and screens
  (auth)/               Sign-in routes
  (protected)/          Authenticated routes
    (tabs)/              Home and profile tabs
    album/               Album detail and rating modal
components/             Shared UI components
constants/              Theme values
contexts/               React auth context
hooks/                  Auth-session and styling hooks
services/               Deezer, Firebase Auth, and Firestore operations
storage/auth/            Firebase Auth persistence adapter
types/                  Album and user data types
utils/                  Formatting, logging, and Sentry wrappers
__tests__/              Screen tests
```

## Current UI behavior and limitations

- The profile avatar picker updates the image preview in screen-local state;
  it does not upload or persist a new profile photo.
- The listen-later action adds or updates a saved record. There is no
  remove-from-list operation in the current service layer.
- The profile displays recent reviews and saved albums, but the current
  Firestore reads filter by user and apply a limit without sorting. They are
  not guaranteed to be the newest records.
