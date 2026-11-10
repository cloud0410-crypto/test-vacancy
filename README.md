# PM Career Intelligence

A Next.js dashboard for discovering public Product Management job postings, matching a resume against a job description, and tracking applications.

## Features

- Live role discovery from public Greenhouse, Ashby and Lever job-board APIs.
- Filters by company and location; search by title, department or company.
- Direct employer application links.
- Resume parsing for PDF, DOCX and TXT.
- Deterministic resume/JD alignment score with skill-category breakdown.
- Optional OpenAI hiring-manager feedback.
- Application tracking stored in browser localStorage.
- 15-minute server-side caching to reduce calls to employer job boards.

## Quick start

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Deploy to GitHub + Vercel

1. Create a new GitHub repository.
2. Extract this ZIP and push the files:

```bash
git init
git add .
git commit -m "Initial PM Career Intelligence app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

3. In Vercel, select **Add New → Project**, import the GitHub repository and deploy.
4. Vercel detects Next.js automatically. No database is required for the starter version.
5. Optional: add `OPENAI_API_KEY` and `OPENAI_MODEL` in Vercel → Project → Settings → Environment Variables, then redeploy.

## Job sources and configuration

`lib/companies.ts` contains the company board registry. The app calls public, read-only ATS endpoints:

- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
- Ashby: `https://api.ashbyhq.com/posting-api/job-board/{slug}`
- Lever: `https://api.lever.co/v0/postings/{slug}?mode=json`

The registry is intentionally editable because companies can change ATS vendors or board slugs. A company may be temporarily unavailable or may return zero PM roles. The dashboard shows feed failures rather than fabricating vacancies.

You can override the registry by setting `JOB_BOARDS` to a JSON array in Vercel environment variables. Example:

```json
[
  {
    "company": "Example Co",
    "provider": "greenhouse",
    "slug": "exampleco",
    "careersUrl": "https://example.com/careers"
  }
]
```

Allowed providers: `greenhouse`, `ashby`, `lever`.

## Resume analysis

The baseline matcher compares phrases and skill evidence across product strategy, discovery, analytics, execution, technical fluency and business impact. It is a transparent heuristic, not a real ATS score and not a hiring decision.

When `OPENAI_API_KEY` is configured, the app also sends extracted resume text and the selected job description to the OpenAI Responses API to produce additional feedback. Do not enable this unless you are comfortable sending those materials to the configured AI provider. Keep the API key server-side; never prefix it with `NEXT_PUBLIC_`.

The starter app does not persist uploaded resume files or resume text in a database. Application statuses and notes are browser-local only and will not sync across devices. Clearing browser storage removes this tracker.

## Before using this as a long-term personal system

Recommended production upgrades:
- Add Supabase Auth and a Postgres database for cross-device saved jobs and application history.
- Add scheduled daily ingestion and historical snapshots for role-change alerts.
- Add stronger resume parsing, duplicate detection and company-specific role taxonomy.
- Add salary, level, visa and remote/hybrid filters where reliable structured data is available.
- Add privacy policy, retention controls, rate limiting and upload malware scanning.
- Add tests and monitor API response failures.

## Important limitations

- This app discovers jobs from selected companies' public ATS feeds; it does not crawl every tech company.
- “Open” means the role is currently returned by the public job-board endpoint. Always confirm on the employer's site before applying.
- Product role detection uses title and department keywords, so some relevant adjacent roles may be missed and some false positives may appear.
- Job listings and resume scores are informational only.
