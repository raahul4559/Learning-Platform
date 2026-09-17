# Pathwise — AI Personalized DSA Learning Planner

Pathwise is a focused DSA learning-planner MVP. It takes a learner's language, level, goal, daily time, deadline, and preferred learning style, then provides an ordered learn → practice → review → assessment loop.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` when connecting PostgreSQL.
2. Install packages: `npm install`.
3. Start the demo: `npm run dev`.
4. Open `http://localhost:3000`.

The current demo persists its state in browser local storage. The Prisma schema is ready to use when authentication and a PostgreSQL-backed repository layer are connected.

## Validation

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Structure

- `app/` — route-level UI
- `components/` — reusable client UI
- `lib/roadmap-engine.ts` — structured plan generation
- `lib/recommendation-engine.ts` — adaptive progression guidance
- `lib/ai/` — swappable AI-provider interface
- `lib/data.ts` — seeded topics and resource metadata
- `prisma/schema.prisma` — PostgreSQL data model, including resource-to-topic mappings
