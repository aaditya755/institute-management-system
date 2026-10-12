# Milestone Coaches     cganges the readme fdile and changesd drelkete button

Premium Institute Management System for Milestone Coaches.

Tagline: `Every Step Forward Counts`

Built with:
- Next.js 14 App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth v5
- Tailwind CSS
- Radix UI
- Recharts
- Gemini API

## Features

- Role-based dashboards for `Admin`, `Faculty`, and `Student`
- Student enrollment and profile management
- Faculty management and assignment tracking
- Batch creation and weekly timetable views
- Attendance marking and reporting
- Fee tracking and payment updates
- Exam scheduling and result entry
- Student-facing academic analytics
- Nova AI study companion for students

## Tech Stack

- Framework: `Next.js 14.2.5`
- Database: `PostgreSQL (Neon)`
- ORM: `Prisma`
- Auth: `NextAuth.js v5`
- UI: `Tailwind CSS + Radix UI`
- Forms: `react-hook-form + zod`
- Charts: `Recharts`
- Toasts: `sonner`
- Dates: `date-fns`
- Passwords: `bcryptjs`

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-key"

NEXT_PUBLIC_APP_NAME="Milestone Coaches"
NEXT_PUBLIC_APP_TAGLINE="Every Step Forward Counts"
```

## Getting Started

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Push schema to the database:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run db:seed
```

Start development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Default Login Credentials

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@milestone.com  | Admin@123   |
| Faculty | priya@milestone.com  | Faculty@123 |
| Faculty | rahul@milestone.com  | Faculty@123 |
| Faculty | ananya@milestone.com | Faculty@123 |
| Student | arjun@milestone.com  | Student@123 |
| Student | sneha@milestone.com  | Student@123 |

## Database Setup

1. Create a project in [Neon](https://neon.tech)
2. Copy the connection string
3. Paste it into `DATABASE_URL`
4. Run:

```bash
npm run db:push
npm run db:seed
```

## Gemini Setup

1. Create an API key at [Google AI Studio](https://aistudio.google.com)
2. Add it to:

```env
GEMINI_API_KEY="your-key"
```

## Production Deployment

1. Push this code to GitHub
2. Import the repository into Vercel
3. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_TAGLINE`
4. Set build command:

```bash
prisma generate && next build
```

5. Deploy
6. Run the seed against the production database if needed

## Project Structure

```txt
src/
  app/
  components/
  hooks/
  lib/
  types/
prisma/
```

## Notes

- Keep `.env` out of Git
- Do not expose `DATABASE_URL`, `NEXTAUTH_SECRET`, or `GEMINI_API_KEY`
- Rotate secrets before production if they were shared anywhere publicly

## License

Private project for Milestone Coaches.
