# Reachly — Claude Code Project Bible

## What Is Reachly?

Reachly is a two-sided mobile marketplace that matches local small businesses
with micro/nano influencers (500–50K followers) using a Tinder-style swipe
mechanic. Brands discover creators, creators discover brand campaigns, and when
both sides swipe right — a match is made and chat unlocks.

Think: Tinder for influencer marketing, built mobile-first, starting in Phoenix AZ.

---

## Current Build Status

**Foundation is complete. No screens exist yet.**

What's already built and should NEVER be recreated or modified without asking:

- `lib/types/database.ts` — Full TypeScript types matching the live Supabase schema
- `lib/supabase.ts` — Typed Supabase client using EXPO_PUBLIC_ env vars
- `lib/theme.ts` — Brand theme, colors, fonts, spacing, radius scales
- `app/_layout.tsx` — Root layout with Archivo fonts loading via expo-splash-screen

---

## Supabase Schema (FINAL — DO NOT MODIFY)

The schema is already live in production. Do NOT create new tables, rename
columns, or alter existing ones without explicit approval. If you think a
schema change is needed, ask first.

**Project ref:** bixxzxokvbsppyjgioae

### Tables (all in public schema)

| Table | Purpose |
|---|---|
| `profiles` | Base user row for every account (brand or creator) |
| `brand_profiles` | Extended profile for brand/business accounts |
| `creator_profiles` | Extended profile for influencer/creator accounts |
| `portfolio_items` | Creator's past work samples for media kit |
| `swipes` | Every swipe action (like, pass, super) |
| `matches` | Mutual likes — auto-created by Postgres trigger |
| `messages` | In-app chat between matched brand + creator |
| `campaigns` | Active deals negotiated through the app |
| `campaign_performance` | Post-campaign analytics and ROI data |
| `deal_board_posts` | Open campaign slots brands post publicly |
| `deal_board_applications` | Creator applications to deal board posts |
| `subscriptions` | RevenueCat subscription sync |

### Critical field names (use EXACTLY these, no aliases)

- `profiles.user_type` — NOT `role`, NOT `user_role`. Values: `'brand' | 'creator'`
- `profiles.onboarding_completed` — boolean
- `creator_profiles.niche_tags` — text[] array, NOT `niches` or `target_niches`
- `creator_profiles.handle` — unique creator username
- `brand_profiles.monthly_budget_min` / `monthly_budget_max` — NOT `budget_min/max`
- `brand_profiles.business_name` — NOT `company_name`
- `matches.matched_at` — NOT `created_at`
- `messages.read` — boolean, NOT `read_at`

### Auto-match trigger
When both a brand and creator swipe 'like' or 'super' on each other, a
Postgres trigger (`on_swipe_check_match`) automatically inserts a row into
`matches`. You do NOT need app-side logic to check for mutual likes.

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Mobile | React Native + Expo SDK 56 | Already installed |
| Routing | Expo Router (file-based) | `app/` directory |
| Backend | Supabase | Auth + Postgres + Realtime |
| Fonts | @expo-google-fonts/archivo | Already installed |
| Subscriptions | react-native-purchases (RevenueCat) | Already installed |
| AI matching | Claude API (claude-sonnet-4-6) | For match scoring + brief generation |
| Animations | react-native-reanimated | Already installed |

### npm install rule
ALWAYS use `--legacy-peer-deps` for any new package installs:
```bash
npm install <package> --legacy-peer-deps
```
Never use `npx expo install` for third-party packages — only for Expo SDK packages.

### Env vars
```
EXPO_PUBLIC_SUPABASE_URL=https://bixxzxokvbsppyjgioae.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key in .env>
```
Never use the service role key in the app. Never put secrets in EXPO_PUBLIC_ vars.
After any .env change: `npx expo start --clear`

### Claude API calls
Use plain `fetch` with the `anthropic-dangerous-direct-browser-access` header.
Do NOT use the Anthropic SDK (it doesn't work in React Native).
Model: `claude-sonnet-4-6`
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_KEY!,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  }),
});
```

---

## Brand & Design System

### Colors
```
Primary:    #4E00BF  (Reachly Purple)
Secondary:  #003070  (Reachly Navy)
```

### Typography — Archivo (Google Fonts)
```
headlines / titles / buttons:  Archivo-Bold  (700) or Archivo-Black (900)
body copy / descriptions:      Archivo-Light (300)
small labels / captions:       Archivo-Regular (400)
```

Font names registered in _layout.tsx:
- `'Archivo-Light'`
- `'Archivo-Bold'`
- `'Archivo-Black'`

Always reference fonts from `lib/theme.ts`:
```typescript
import { fonts, typeScale } from '../lib/theme';
```

### Two-Mode Design System (CRITICAL)

Reachly has TWO visual modes — one per user type:

**Creator Mode → Dark**
- Background: `#0D0614` (near-black, purple undertone)
- Surface: `#16101F`
- Card: `#1F1729`
- Text: `#F5F3F9`
- Muted text: `#A89FB8`
- Feel: energetic, social-app native (think Instagram/TikTok)

**Brand Mode → Light**
- Background: `#FFFFFF`
- Surface: `#F7F5FA` (faint purple-tinted off-white)
- Card: `#FFFFFF`
- Card2: `#F0ECF7`
- Text: `#1A1422`
- Muted text: `#6B6478`
- Feel: clean, professional, trustworthy (think SaaS dashboard)

Both modes use the same purple/navy brand colors. Only the surfaces invert.

Use the theme helper:
```typescript
import { getTheme } from '../lib/theme';
const theme = getTheme(userType); // 'creator' | 'brand'
```

Never hardcode colors. Always pull from theme.

### Spacing & Radius
```typescript
import { spacing, radius } from '../lib/theme';
// spacing: xs=4, sm=8, md=12, lg=16, xl=24, xxl=32
// radius: sm=8, md=12, lg=16, xl=24, full=999
```

---

## App Architecture

### Route Groups (Expo Router)
```
app/
├── _layout.tsx              ← Root layout (fonts, splash, Stack navigator)
├── (auth)/                  ← Unauthenticated screens
│   ├── _layout.tsx
│   ├── welcome.tsx          ← First screen: Brand or Creator?
│   ├── login.tsx
│   └── signup.tsx
├── (creator)/               ← Creator dark-mode workflow
│   ├── _layout.tsx          ← Tab navigator (dark theme)
│   ├── discover.tsx         ← Swipe brands
│   ├── matches.tsx          ← Chat list
│   ├── analytics.tsx        ← Performance dashboard
│   ├── community.tsx        ← Phoenix leaderboard + deal board
│   └── profile.tsx          ← Creator profile + media kit
└── (brand)/                 ← Brand light-mode workflow
    ├── _layout.tsx          ← Tab navigator (light theme)
    ├── discover.tsx         ← Swipe creators
    ├── matches.tsx          ← Chat list
    ├── analytics.tsx        ← ROI dashboard
    ├── community.tsx        ← Deal board management
    └── profile.tsx          ← Brand profile
```

### Auth Flow
1. User opens app → check Supabase session
2. No session → `(auth)/welcome.tsx` (choose Brand or Creator)
3. Session exists but `onboarding_completed = false` → onboarding flow
4. Session + onboarding done → redirect to `(creator)` or `(brand)` based on `user_type`

### AuthProvider
Lives at `providers/AuthProvider.tsx`. Reads from `profiles` table — NOT a
`users` table. Exposes: `session`, `user`, `profile`, `userType`, `loading`,
`signOut`, `refreshProfile`.

---

## Core Features (Build Order)

### Phase 1 — Auth & Onboarding (Build First)
1. `(auth)/welcome.tsx` — Choose Brand or Creator, visual split
2. `(auth)/signup.tsx` — Email/password + user_type written to `profiles`
3. `(auth)/login.tsx` — Standard login
4. Brand onboarding — business_name, category, budget range, target audience
5. Creator onboarding — handle, niche_tags, platform connections, rate card

### Phase 2 — Core Loop
6. Discover screen (both sides) — swipe cards with AI match scoring
7. Match trigger confirmation — "It's a Match!" moment
8. Matches/chat screen — real-time messaging via Supabase Realtime
9. Campaign brief generator — Claude API generates brief on match

### Phase 3 — Creator Value
10. Creator profile / media kit builder
11. Portfolio gallery
12. Verified badge system
13. Rate card manager

### Phase 4 — Brand Value
14. Campaign builder
15. Analytics / ROI dashboard
16. Exportable PDF reports

### Phase 5 — Community & Retention
17. City-based leaderboard (Phoenix first)
18. Deal board (post + apply)
19. Creator-to-creator collab pitches

---

## Subscription Tiers

**Creators**
- Free: 5 swipes/day, 1 active deal, community access, media kit builder
- Pro ($12/mo): unlimited swipes, verified badge, full analytics, priority in brand feeds

**Brands**
- Starter ($49/mo): 2 active campaigns, basic filters, AI match scoring
- Growth ($99/mo): unlimited campaigns, advanced AI matching, ROI dashboard, PDF reports
- Agency ($249/mo): multi-brand management, white-label reports

RevenueCat product IDs (to be set up):
- `creator_pro_monthly`
- `brand_starter_monthly`
- `brand_growth_monthly`
- `brand_agency_monthly`

---

## AI Match Scoring (Claude API)

When a brand views a creator card, call Claude API to generate:
1. A match score (0–100)
2. A one-line match reason

Prompt pattern:
```
Given this brand profile:
- Category: {category}
- Target audience: {target_audience}, ages {target_age_min}-{target_age_max}, {target_gender}
- Budget: ${monthly_budget_min}-${monthly_budget_max}/month
- Location: {city}, {state}

And this creator profile:
- Niche tags: {niche_tags}
- Followers: {instagram_followers} IG, {tiktok_followers} TikTok
- Engagement rate: {engagement_rate}%
- Audience: {audience_age_range}, {audience_gender_split}% female
- Rate: ${rate_post}/post
- Location: {city}, {state}

Return a JSON object with:
- score: number 0-100
- reason: string (one sentence, max 120 chars, plain English)
```

Store `match_score` and `match_reason` on the `swipes` row when inserting.

---

## Go-To-Market Context (Phoenix First)

- Start with Phoenix AZ brands and creators only
- Target niches: fitness, food, lifestyle, fashion, beauty
- City-based leaderboards and community feeds per city
- Expand city by city: Phoenix → Scottsdale → Tempe → Tucson → national

---

## Subagents Available

`.claude/agents/` contains:
- `expo-debugger.md` — diagnose before fix, check logs first
- `supabase-reviewer.md` — RLS policy and query review
- `code-reviewer.md` — general code quality review

Use these when hitting bugs or before committing major changes.

---

## Patterns & Rules

- **Diagnose before fixing** — read the error fully, check logs, understand
  root cause before writing any fix code
- **One screen at a time** — build, review, confirm before moving to next
- **No silent schema changes** — if a table or column seems missing, ask
- **Commit after each logical feature** — not after every file change
- **Test on device** — run via `npx expo start --clear` and test on iPhone
  before marking anything done
- **Never expose service role key** — anon key only in the app
- **RLS is on** — every Supabase query must work within the RLS policies
  already defined. If a query returns empty unexpectedly, check RLS first.

---

## What NOT To Do

- Do NOT create a `users` table — the base table is `profiles`
- Do NOT use `role` as the user type field — it's `user_type`
- Do NOT use `company_name` — it's `business_name`
- Do NOT use `niches` or `target_niches` — it's `niche_tags`
- Do NOT use `budget_min/max` — it's `monthly_budget_min/max`
- Do NOT use `read_at` on messages — it's `read` (boolean)
- Do NOT hardcode colors — always use theme
- Do NOT install packages without `--legacy-peer-deps`
- Do NOT use the Anthropic SDK — use plain fetch for Claude API calls
- Do NOT run multiple screens ahead without review
