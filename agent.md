# GrammarQuest Project Reference

## What This Project Is

GrammarQuest is a kid-friendly grammar learning game built as a TanStack Start app with React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and MongoDB via Mongoose.

The current experience is a short quest flow:

1. Landing page at `/`
2. Avatar selection at `/avatar`
3. World map at `/map`
4. Lesson/quest play at `/lesson/$id`

The theme is "Naming Kingdom", focused on noun basics for children roughly ages 7-12.

## Stack

- App framework: TanStack Start
- UI: React 19
- Routing: TanStack Router with file-based routes
- Data fetching/cache: TanStack Query
- Styling: Tailwind CSS v4 plus custom CSS utilities in `src/styles.css`
- Database: MongoDB with Mongoose
- Build tool: Vite
- Package manager files present: `package-lock.json` and `bun.lock`

## Important Source Files

- App shell: `src/routes/__root.tsx`
- Router factory: `src/router.tsx`
- Start entry: `src/start.ts`
- SSR server wrapper: `src/server.ts`
- Landing page: `src/routes/index.tsx`
- Avatar page: `src/routes/avatar.tsx`
- Map page: `src/routes/map.tsx`
- Lesson page: `src/routes/lesson.$id.tsx`
- Client game state/provider: `src/lib/game-store.tsx`
- Server auth helpers: `src/lib/api/auth.server.ts`
- Server game helpers: `src/lib/api/game.server.ts`
- DB connection: `src/server/db/index.ts`
- DB schemas: `src/server/db/schemas.ts`
- Seed script: `scripts/seed.ts`
- Seed data: `scripts/data.json`

## Route Structure

TanStack Start uses file-based routing from `src/routes`.

- `src/routes/__root.tsx`: global shell, query provider, game provider, meta tags, fonts
- `src/routes/index.tsx`: marketing/landing page
- `src/routes/avatar.tsx`: avatar picker
- `src/routes/map.tsx`: quest map with milestone unlock logic
- `src/routes/lesson.$id.tsx`: lesson runtime for a selected milestone

`src/routeTree.gen.ts` is generated and should not be edited manually.

## Runtime Flow

### Guest user

On first server contact, `getGuestUser()`:

- connects to MongoDB
- checks `guest_user_id` cookie
- creates a guest user if needed
- persists the cookie for later visits

This means progress is tied to the guest cookie and the backing database record.

### Global game state

`GameProvider` in `src/lib/game-store.tsx`:

- fetches current user
- fetches badges
- exposes avatar, XP, completed milestones, and helper mutations
- uses optimistic updates for avatar changes

### Map and progression

`/map` fetches:

- learning path records
- milestone records

Unlocking is sequential. A milestone is available only if the previous milestone is completed, except the first one.

### Lesson flow

`/lesson/$id`:

- loads map data to find the current milestone
- verifies the milestone is unlocked
- fetches questions for that milestone
- tracks hearts locally in component state
- awards question XP through the server on correct answer
- awards milestone completion XP through the server once per milestone
- shows a reward modal after completion

## Data Model

Defined in `src/server/db/schemas.ts`.

### Collections

- `User`
  - `name`
  - `avatar`
  - `total_xp`
  - `completed_milestones`
- `LearningPath`
  - `id`
  - `title`
  - `description`
  - `order`
- `Milestone`
  - `id`
  - `learning_path_id`
  - `title`
  - `story_intro`
  - `completion_message`
  - `order`
  - `xp_reward`
- `Question`
  - `id`
  - `milestone_id`
  - `concept`
  - `skill`
  - `difficulty`
  - `question_type`
  - `prompt`
  - `options`
  - `answer`
  - `image_url`
- `QuestionAttempt`
  - `user_id`
  - `question_id`
  - `correct`
  - `timestamp`
- `UserReward`
  - `user_id`
  - `reward_type`
  - `badge_id`
  - `unlocked_at`

## Current Content

The seeded adventure currently includes:

- 1 learning path: `naming-kingdom`
- 3 milestones:
  - `missing-names`
  - `special-names`
  - `one-and-many`
- 15 seeded questions in `scripts/data.json`

## Styling Notes

The visual direction is playful and child-oriented:

- display font: Fredoka
- body font: Nunito
- custom quest button utilities: `btn-quest`, `btn-quest-hover`
- background and color tokens are defined in `src/styles.css`
- the app uses Tailwind v4 with CSS-first theme tokens

## Server and Error Handling

- `src/start.ts` adds request middleware to catch unexpected server errors and render a custom HTML error page.
- `src/server.ts` wraps TanStack Start server entry and normalizes some SSR 500 cases into the same custom error page.

## Seed and Local Data Setup

The seed script:

- reads `scripts/data.json`
- clears learning paths, milestones, and questions
- inserts fresh content into MongoDB

Seed data is the main current source for map and lesson content stored in the database.

## Important Caveats

### 1. Database URI is hardcoded

`src/server/db/index.ts` currently contains a hardcoded MongoDB connection string instead of reading from environment variables. This is a security and maintenance risk.

### 2. Two lesson content sources exist

There is a static lesson definition file at `src/lib/lessons.ts`, but the live lesson flow fetches questions from MongoDB through `src/lib/api/game.server.ts`.

Right now, the database-backed content appears to be the active source of truth for gameplay.

### 3. Some UI assumptions are placeholder-level

- milestone reward badges are randomly assigned on completion
- `RewardModal` currently receives a placeholder badge string
- lesson question rendering includes compatibility mapping from DB shape to frontend shape

### 4. Progress is guest-cookie based

If the cookie is lost or the guest record changes, the user's apparent progress will also change.

## How To Approach Future Changes

- For gameplay/content changes, inspect both `scripts/data.json` and server query/mutation files first.
- For progression or XP behavior, start in `src/lib/game-store.tsx` and `src/lib/api/game.server.ts`.
- For route/page changes, work from `src/routes`.
- For visual system changes, start with `src/styles.css` and then the route/component files.
- For data model changes, update both Mongoose schemas and any seed/server logic that depends on them.

## Safe Assumptions For Future Agents

- This is a small MVP/prototype-style codebase.
- MongoDB is required for the current live app flow.
- The app is SSR-capable and has custom server-side error handling.
- The generated route tree should not be manually edited.
- The `src/components/ui` directory contains mostly shared shadcn/Radix-style primitives, while the gameplay-specific behavior lives in route files and `src/lib`.
