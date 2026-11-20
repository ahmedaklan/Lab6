# SplitSmart prototype

A small group expense tracker built with Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite. Groups, members, expenses, and equal participant shares are stored in SQLite. Amounts and shares use integer cents.

## Run locally

```bash
cd prototype
cp .env.example .env
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Prisma resolves the relative SQLite URL from `prisma/schema.prisma`, so the database is stored at `prototype/prisma/splitsmart.db`. Keep that file to retain your data. `db push` applies the current schema without deleting existing rows.

For checks:

```bash
npm run lint
npm run build
```

No authentication, payment processing, or deployment configuration is included.
