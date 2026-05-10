# Rave

Rave is an Expo and React Native social app for discovering food, drink, and activity recommendations from people you trust. Users can post places, mark them as `Raved` or `Delisted`, follow other users, save places to a personal list, and browse recommendations by feed, map, city, or profile.

## Quick Start

Install dependencies from the lockfile:

```bash
npm ci
```

Start the Expo dev server:

```bash
npm start
```

Common launch targets:

```bash
npm run ios
npm run android
npm run web
```

Check the project before handing off changes:

```bash
npm run check
```

That runs ESLint and TypeScript in no-emit mode.

## How The App Fits Together

This app uses Expo Router. The `app/` directory is the route tree:

- `app/_layout.tsx` is the root stack layout. It loads the Supabase auth session and redirects signed-out users to sign-in, while allowing the onboarding and auth routes to stay public.
- `app/(auth)/sign-in.tsx` and `app/(auth)/sign-up.tsx` handle email/password auth through Supabase.
- `app/onboarding.tsx` is the first-run intro screen. It stores `hasSeenOnboarding` in `AsyncStorage`.
- `app/(tabs)/_layout.tsx` defines the signed-in tab bar.
- `app/(tabs)/index.tsx` is the feed of posts from the current user and followed users.
- `app/(tabs)/post.tsx` creates a new rave, uploads photos, geocodes the place, and inserts the post.
- `app/(tabs)/explore.tsx` shows a map of network posts with coordinates.
- `app/(tabs)/profile.tsx` shows the current user's profile, counts, cities, posts, avatar upload, bio editing, and saved-list entry point.
- Stack screens such as `app/post-detail.tsx`, `app/city.tsx`, `app/search.tsx`, `app/user-profile.tsx`, `app/saved.tsx`, and `app/notifications.tsx` are opened from the tabs.

Shared pieces live outside `app/`:

- `lib/supabase.js` creates the Supabase client and persists auth sessions in `AsyncStorage`.
- `constants/theme.ts` contains Rave's color, radius, spacing, font, and shadow tokens.
- `components/CategoryIcon.tsx` maps `eat`, `drink`, and `do` categories to Ionicons.
- `hooks/` and the remaining `components/` files are mostly Expo starter helpers, kept compiling for any screens that still import them.

For a deeper route and data walkthrough, see [docs/architecture.md](docs/architecture.md).

## Backend Expectations

The app expects a Supabase project with these tables and storage buckets:

- `profiles`: user profile rows keyed by auth user id, including `username`, `avatar_url`, and `bio`.
- `posts`: place recommendations with `user_id`, `venue_name`, `city`, `category`, `content`, `on_list`, `photo_urls`, `latitude`, `longitude`, and timestamps.
- `follows`: follower/following relationships.
- `saves`: saved posts for each user.
- `notifications`: currently used for follow notifications.
- Storage buckets: `avatars` and `posts`.

The Supabase anon key in `lib/supabase.js` is a public client key, not a service key. Row Level Security policies still need to protect private or user-owned data.

## Library Documentation

Context7 is configured in `.mcp.json` so agents can fetch current library docs before changing fast-moving APIs. See [AGENTS.md](AGENTS.md) for the project rule.

Developers who need higher Context7 limits can set `CONTEXT7_API_KEY` in their local environment before their MCP client starts.
