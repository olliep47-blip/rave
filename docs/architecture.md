# Architecture

This document explains the current Rave app structure for developers who are new to Expo.

## Runtime Stack

- Expo SDK 54 runs the React Native app on iOS, Android, and web.
- Expo Router turns files under `app/` into navigation routes.
- Supabase provides authentication, database access, and storage.
- React Native Maps renders map screens and post detail maps.
- Expo Location handles geocoding for places and cities.
- Expo Image Picker and Expo File System support photo selection and upload.

## Navigation Model

Expo Router uses file-based routing:

- `app/_layout.tsx` wraps the whole app in a stack navigator.
- `app/(auth)` is a route group for signed-out screens. The group name is for organization and does not appear in the URL.
- `app/(tabs)` is the signed-in tab navigator.
- Files directly under `app/`, such as `city.tsx` and `post-detail.tsx`, are stack screens that can be pushed from anywhere.

The root layout keeps the auth boundary in one place:

1. It asks Supabase for the persisted auth session.
2. It subscribes to auth state changes.
3. It allows signed-out users to visit onboarding and auth screens.
4. It redirects other signed-out routes to sign-in.
5. It redirects signed-in users away from onboarding and auth screens to the tab app.

## Product Flow

On first launch, `app/(auth)/sign-in.tsx` checks `AsyncStorage` for `hasSeenOnboarding`. If the flag is missing, it sends the user to `app/onboarding.tsx`. Completing onboarding sets the flag and returns to sign-in.

After sign-in, users land in the feed tab:

- Feed queries `follows` to find the current user's network, then loads matching `posts` with each author's profile.
- Post creation uploads selected images to the `posts` storage bucket, geocodes the venue and city, then inserts a `posts` row.
- Map shows network posts that already have latitude and longitude.
- Profile groups the current user's posts by city and supports avatar and bio updates.
- Search finds profiles by username and toggles rows in `follows`.
- City shows posts for a city, either from the user's network or everyone, and filters by category.
- Post detail supports save, edit, delete, and a static map preview.
- Saved reads from `saves` and shows the user's bookmarked posts.
- Notifications currently display follow notifications and mark them read when opened.

## Data Model

The code currently assumes these Supabase records:

| Table | Purpose | Important fields |
| --- | --- | --- |
| `profiles` | Public user profiles | `id`, `username`, `avatar_url`, `bio` |
| `posts` | Place recommendations | `id`, `user_id`, `venue_name`, `city`, `category`, `content`, `on_list`, `photo_urls`, `latitude`, `longitude`, `created_at` |
| `follows` | Social graph | `id`, `follower_id`, `following_id`, `created_at` |
| `saves` | Personal saved list | `id`, `user_id`, `post_id`, `created_at` |
| `notifications` | Activity notifications | `id`, `user_id`, `actor_id`, `type`, `read`, `created_at` |

Storage buckets:

| Bucket | Used by | Contents |
| --- | --- | --- |
| `avatars` | `app/(tabs)/profile.tsx` | One avatar image per user |
| `posts` | `app/(tabs)/post.tsx` | Up to five photos per post |

The app uses `any` for Supabase responses today. A good future cleanup is generating typed Supabase definitions and replacing broad `any[]` state with table-specific types.

## Development Commands

```bash
npm ci
npm start
npm run ios
npm run android
npm run web
npm run lint
npm run typecheck
npm run check
```

`npm run lint` calls ESLint directly instead of `expo lint`, because the direct command works cleanly in local sandboxes and CI without requiring the Expo CLI to write telemetry state under the user's home directory.

## Current Risks And Follow-Ups

- The Supabase schema and RLS policies are not documented in SQL yet. Add migrations or at least a schema reference before more backend work.
- The Supabase client config is hard-coded in `lib/supabase.js`. That is acceptable for public anon credentials, but Expo public environment variables would make staging and production projects easier to switch.
- There is duplicated fetch and render logic across feed, profile, user profile, city, saved, and post detail screens.
- Some screens use iOS-specific `ActionSheetIOS`; Android and web should get an equivalent action menu or alert fallback.
- Location search uses public Nominatim geocoding directly from the client. Production usage should respect the service policy and may need a backend proxy or a dedicated places API.
- Notifications assume follow-only notification records. Expanding notification types will need a stricter renderer and table constraints.
