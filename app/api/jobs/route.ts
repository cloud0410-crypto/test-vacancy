import { NextResponse } from "next/server";
import { getBoards, type CompanyBoard } from "@/lib/companies";

export const revalidate = 900;
export const runtime = "nodejs";

type Job = {
  id: string; title: string; company: string; location: string; department: string;
  description: string; url: string; postedAt: string | null; provider: string; careersUrl: string;
};

function htmlToText(input = "") {
  return input.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function isProductRole(title: string, department = "", description = "") {
  const text = `${title} ${department}`.toLowerCase();
  const positive = /\b(product manager|product management|group product|director of product|head of product|vp product|product lead|product owner|technical product manager|product operations|product strategy)\b/.test(text);
  const negative = /\b(product marketing|product designer|product counsel|product support|product analyst|product engineer|product specialist|product sales)\b/.test(text);
  // Product Analyst can be a relevant adjacent path, so it is excluded from default results to keep the signal high.
  return positive && !negative;
}

async function fetchGreenhouse(board: CompanyBoard): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`;
  const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Greenhouse ${res.status}`);
  const data = await res.json();
  return (data.jobs ?? []).map((j: any) => ({
    id: `${board.company}-${j.id}`, title: j.title ?? "", company: board.company,
    location: j.location?.name ?? "Location not listed",
    department: (j.departments ?? []).map((d: any) => d.name).join(", "),
    description: htmlToText(j.content ?? ""), url: j.absolute_url ?? board.careersUrl,
    postedAt: j.updated_at ?? null, provider: "Greenhouse", careersUrl: board.careersUrl
  }));
}

async function fetchAshby(board: CompanyBoard): Promise<Job[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.slug)}?includeCompensation=true`;
  const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Ashby ${res.status}`);
  const data = await res.json();
  return (data.jobs ?? []).map((j: any) => ({
    id: `${board.company}-${j.id}`, title: j.title ?? "", company: board.company,
    location: j.location ?? j.locationName ?? "Location not listed",
    department: j.department ?? j.team ?? "",
    description: htmlToText(j.descriptionPlain ?? j.descriptionHtml ?? ""),
    url: j.jobUrl ?? j.applyUrl ?? board.careersUrl,
    postedAt: j.publishedAt ?? null, provider: "Ashby", careersUrl: board.careersUrl
  }));
}

async function fetchLever(board: CompanyBoard): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`;
  const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Lever ${res.status}`);
  const data = await res.json();
  return (data ?? []).map((j: any) => ({
    id: `${board.company}-${j.id}`, title: j.text ?? "", company: board.company,
    location: j.categories?.location ?? "Location not listed",
    department: [j.categories?.team, j.categories?.department].filter(Boolean).join(", "),
    description: htmlToText(j.descriptionPlain ?? j.description ?? ""),
    url: j.hostedUrl ?? j.applyUrl ?? board.careersUrl,
    postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    provider: "Lever", careersUrl: board.careersUrl
  }));
}

async function fetchBoard(board: CompanyBoard): Promise<Job[]> {
  if (board.provider === "greenhouse") return fetchGreenhouse(board);
  if (board.provider === "ashby") return fetchAshby(board);
  return fetchLever(board);
}

export async function GET() {
  const boards = getBoards();
  const settled = await Promise.allSettled(boards.map(fetchBoard));
  const jobs: Job[] = [];
  const errors: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value.filter((job) => isProductRole(job.title, job.department, job.description)));
    } else {
      errors.push(boards[index].company);
      console.warn(`Could not fetch jobs for ${boards[index].company}:`, result.reason);
    }
  });
  jobs.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
  return NextResponse.json({
    jobs,
    meta: {
      fetchedAt: new Date().toISOString(),
      companiesConfigured: boards.length,
      companiesResponding: boards.length - errors.length,
      companiesUnavailable: errors,
      count: jobs.length,
      cacheMinutes: 15
    }
  }, { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } });
}
