# CarDekho — Car Recommendation MVP

What did you build and why? What did you deliberately cut?
I have build an AI-assisted car recommendation platform that helps users go from vague requirements to a list of cars and options to compare with. The system extracts structed prefrences, scores available vehicles using LLM(currently limited due to usage limit). It also gives the option to compare upto 3 cars. The Idea was to keep the UI minimal and go from a idea to a MVP product with few hours,i have excluded Authentication, Large-scale vehicle dataset, advance filtering and chat history.

What’s your tech stack and why did you pick it?
I used Next.js with Typescript, Tailwind CSS, Prisma with SQLite and OpenRouter.ai for LLM integration as its a MPV for quick demostration, while keep the code clean, robust, and clean architecture.

What did you delegate to AI tools vs. do manually? Where did the tools help most?
Where did they get in the way?
I used cursor to plan out the system architecture, boilerPlate generation, UI and data modeling, and asked to create the recommendation engine and scoring logic to give a confidence/matching score. I checked the build plan and asked to refactoring the extracted preference from the UI as it is a overhead.

If you had another 4 hours, what would you add?
I would have made the UX more interactive with side by side comparison with image cards, Feedback loop to improve the LLM suggestion, User Authentication and chat history for revisits, Real Car Data ingestion.


## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- SQLite + Prisma ORM
- OpenRouter API (OpenAI-compatible chat completions)
- Vitest (unit/integration), Playwright (e2e)

## Workflow

```
User input → OpenRouter intent extraction → Structured preferences JSON
  → Recommendation engine → Ranked cars → OpenRouter explanations
```

## Quick start

```bash
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY from https://openrouter.ai/keys

npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `OPENROUTER_API_KEY` | API key from [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL` | Model slug, e.g. `google/gemini-2.5-pro` — see [models](https://openrouter.ai/models) |
| `OPENROUTER_SITE_URL` | Optional referer for OpenRouter rankings (default `http://localhost:3000`) |
| `OPENROUTER_APP_NAME` | Optional app name header (default `CarDekho`) |
| `LLM_MODE` | `live` or `mock` (mock for tests) |
| `LLM_FALLBACK_ON_ERROR` | `true` = fallback on any LLM error; default falls back on quota/429 only |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed 150 mock cars |
| `npm run db:reset` | Reset DB and reseed |
| `npm test` | Unit + integration tests |
| `npm run test:e2e` | Playwright e2e tests |

## API

- `POST /api/recommend` — `{ query, sessionId? }`
- `GET /api/searches/[id]` — fetch saved search
- `GET /api/history?sessionId=` — session search history
- `POST /api/admin/seed` — dev-only reseed

## Architecture

- `src/domain` — scoring, types
- `src/application` — use cases
- `src/infrastructure` — Prisma, OpenRouter client, repos
- `app` — UI and route handlers

## Testing

```bash
# Unit + integration (uses mock LLM + test.db)
npm test

# E2E (starts dev server with LLM_MODE=mock)
npm run test:e2e
```
