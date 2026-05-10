# Agent Guide

## Library Docs First Via Context7

The Context7 MCP server is configured for this repo in `.mcp.json`.
Use it with `mcp__context7__resolve-library-id`, then `mcp__context7__get-library-docs`.

This is mandatory before writing code that calls APIs from fast-moving libraries, including:

- `expo`, `expo-router`, and Expo SDK modules such as `expo-location`, `expo-image-picker`, `expo-file-system`, and `expo-updates`
- `@supabase/supabase-js`
- React Native libraries such as `react-native-maps`, `react-native-reanimated`, React Navigation, and Expo Router navigation helpers
- Any new dependency added to the project

If Context7 is unavailable in the current tool session, use the official library docs instead and say that Context7 was not available. Do not write "I believe the API is..." for these libraries. Check the docs or state that you have not checked.

## Project Health Checks

Before handing off code changes, run:

```bash
npm run check
```

If a change is intentionally not verified, say which check was skipped and why.

## Rave Project Notes

- This is an Expo Router app. Files in `app/` become routes, and route groups such as `app/(auth)` and `app/(tabs)` organize screens without changing URLs.
- Supabase is the backend for auth, profiles, posts, follows, saves, notifications, and image storage.
- Keep changes small and aligned with the existing React Native component style until there is an explicit design-system cleanup.
- Do not run `npm run reset-project`; it is the stock Expo starter reset command and would remove the current app.
