"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowUpRight, Bookmark, BriefcaseBusiness, Building2, CheckCircle2,
  ChevronDown, Clock3, FileSearch, Filter, LayoutDashboard, Loader2, MapPin,
  RefreshCw, Search, Sparkles, Target, UploadCloud, X, ExternalLink, Trash2,
  CircleDot, CircleCheck, CalendarDays
} from "lucide-react";

type Job = {
  id: string; title: string; company: string; location: string; department: string;
  description: string; url: string; postedAt: string | null; provider: string; careersUrl: string;
};
type Meta = { fetchedAt: string; companiesConfigured: number; companiesResponding: number; companiesUnavailable: string[]; count: number; cacheMinutes: number };
type Match = { score: number; verdict: string; matchedSkills: string[]; missingSkills: string[]; strengths: string[]; improvements: string[]; breakdown: { label: string; score: number; weight: number }[] };
type Tracked = { status: string; note?: string; savedAt: string };
const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

function timeAgo(date?: string | null) {
  if (!date) return "Date not provided";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < 0) return "Recently updated";
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}
function initials(name: string) { return name.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase(); }

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("All companies");
  const [location, setLocation] = useState("All locations");
  const [sort, setSort] = useState("newest");
  const [activeTab, setActiveTab] = useState("Discover");
  const [tracked, setTracked] = useState<Record<string, Tracked>>({});
  const [selected, setSelected] = useState<Job | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [analysis, setAnalysis] = useState<Match | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setTracked(JSON.parse(localStorage.getItem("pm-career-tracker") || "{}")); } catch { /* ignore */ }
  }, []);
  useEffect(() => { localStorage.setItem("pm-career-tracker", JSON.stringify(tracked)); }, [tracked]);

  async function loadJobs(force = false) {
    force ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", force ? { cache: "no-store" } : {});
      if (!res.ok) throw new Error("Could not retrieve job listings.");
      const data = await res.json();
      setJobs(data.jobs ?? []); setMeta(data.meta ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { loadJobs(); }, []);

  const companies = useMemo(() => ["All companies", ...Array.from(new Set(jobs.map(j => j.company))).sort()], [jobs]);
  const locations = useMemo(() => ["All locations", ...Array.from(new Set(jobs.map(j => j.location).filter(Boolean))).sort()], [jobs]);
  const filtered = useMemo(() => {
    let result = jobs.filter(j => {
      const q = query.toLowerCase();
      return (!q || `${j.title} ${j.company} ${j.location} ${j.department}`.toLowerCase().includes(q))
        && (company === "All companies" || j.company === company)
        && (location === "All locations" || j.location === location);
    });
    result.sort((a,b) => sort === "company" ? a.company.localeCompare(b.company) : sort === "title" ? a.title.localeCompare(b.title) : (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
    return result;
  }, [jobs, query, company, location, sort]);
  const trackedEntries = Object.entries(tracked);
  const savedCount = trackedEntries.filter(([,v]) => v.status === "Saved").length;
  const appliedCount = trackedEntries.filter(([,v]) => v.status === "Applied").length;
  const interviewCount = trackedEntries.filter(([,v]) => v.status === "Interview").length;
  const trackedJobs = jobs.filter(j => tracked[j.id] && (statusFilter === "All" || tracked[j.id].status === statusFilter));

  function updateStatus(job: Job, status: string) {
    setTracked(old => {
      const next = { ...old };
      if (!status) delete next[job.id];
      else next[job.id] = { ...next[job.id], status, savedAt: next[job.id]?.savedAt ?? new Date().toISOString() };
      return next;
    });
  }
  function openAnalyzer(job?: Job) {
    setSelected(job ?? null); setJdText(job?.description || ""); setAnalysis(null); setAiFeedback(""); setAnalysisError(""); setShowAnalyzer(true);
  }
  async function runAnalysis() {
    if (!resumeFile || !jdText.trim()) { setAnalysisError("Upload a resume and add a job description."); return; }
    setAnalyzing(true); setAnalysisError(""); setAnalysis(null); setAiFeedback("");
    const form = new FormData(); form.append("resume", resumeFile); form.append("jobDescription", jdText);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setAnalysis(data.result); setAiFeedback(data.aiFeedback || "");
    } catch (e) { setAnalysisError(e instanceof Error ? e.message : "Analysis failed."); }
    finally { setAnalyzing(false); }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6258e8] text-white shadow-sm"><Activity size={21}/></div>
            <div><div className="text-[15px] font-bold tracking-tight">PM Career Intelligence</div><div className="text-xs text-slate-500">Your product career command centre</div></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex"><span className="mr-1.5 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500"/> Live job feeds</span>
            <button onClick={() => loadJobs(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/><span className="hidden sm:inline">Refresh</span></button>
            <button onClick={() => openAnalyzer()} className="flex items-center gap-2 rounded-lg bg-[#6258e8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5147d5]"><Sparkles size={15}/> Resume match</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8">
        <section className="mb-7 overflow-hidden rounded-2xl bg-[#171936] p-6 text-white shadow-soft md:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-violet-200"><Target size={13}/> Career intelligence workspace</div>
              <h1 className="text-3xl font-bold tracking-tight md:text-[38px]">Find your next <span className="text-violet-300">product role.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Discover product management opportunities across leading technology companies. Compare your resume against each role and manage your application pipeline.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:min-w-[390px]">
              <Metric label="Open roles" value={loading ? "—" : jobs.length.toString()} icon={<BriefcaseBusiness size={15}/>} />
              <Metric label="Saved" value={savedCount.toString()} icon={<Bookmark size={15}/>} />
              <Metric label="Interviews" value={interviewCount.toString()} icon={<CalendarDays size={15}/>} />
            </div>
          </div>
          <div className="pointer-events-none absolute opacity-20" />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={<Building2 size={17}/>} label="Companies monitored" value={meta ? `${meta.companiesResponding}/${meta.companiesConfigured}` : "—"} sub="Public career-board feeds"/>
          <StatCard icon={<Bookmark size={17}/>} label="Roles saved" value={savedCount.toString()} sub="In your application tracker"/>
          <StatCard icon={<CheckCircle2 size={17}/>} label="Applications sent" value={appliedCount.toString()} sub="Marked as applied"/>
        </section>

        <div className="mb-5 flex items-center gap-1 border-b border-slate-200">
          {["Discover", "My applications"].map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? "border-[#6258e8] text-[#5147d5]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{tab}</button>)}
        </div>

        {activeTab === "Discover" ? <>
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div><h2 className="text-lg font-bold">Product management openings</h2><p className="mt-1 text-xs text-slate-500">{meta ? `${meta.count} matching roles from public company job boards` : "Fetching public company job boards…"}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[210px] flex-1 md:flex-none"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search roles or companies" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400"/></div>
              <select value={company} onChange={e => setCompany(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>All companies</option>{companies.slice(1).map(c => <option key={c}>{c}</option>)}</select>
              <select value={location} onChange={e => setLocation(e.target.value)} className="max-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option>All locations</option>{locations.slice(1).map(l => <option key={l}>{l}</option>)}</select>
              <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option value="newest">Recently updated</option><option value="company">Company A–Z</option><option value="title">Role A–Z</option></select>
            </div>
          </div>

          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} Check your deployment logs and ATS board configuration.</div>}
          {meta?.companiesUnavailable?.length ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Some feeds did not respond: {meta.companiesUnavailable.join(", ")}. Other company feeds are still shown.</div> : null}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {loading ? Array.from({length:6}).map((_,i)=><div key={i} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white"/>) :
              filtered.map(job => <JobCard key={job.id} job={job} tracked={tracked[job.id]} onStatus={s => updateStatus(job,s)} onAnalyze={() => openAnalyzer(job)}/>)}
          </div>
          {!loading && !filtered.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center"><FileSearch className="mx-auto text-slate-300" size={32}/><p className="mt-3 font-semibold">No matching roles found</p><p className="mt-1 text-sm text-slate-500">Try another search or refresh the job feeds.</p></div>}
          <div className="mt-5 text-center text-[11px] text-slate-400">Listings are sourced from public employer ATS feeds. Always verify availability and requirements on the employer's application page.</div>
        </> : <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Application pipeline</h2><p className="mt-1 text-xs text-slate-500">Your saved statuses are stored in this browser.</p></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {trackedJobs.length ? trackedJobs.map(job => <div key={job.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center"><div><div className="font-semibold">{job.title}</div><div className="mt-1 text-xs text-slate-500">{job.company} · {job.location}</div></div><div className="flex items-center gap-2"><select value={tracked[job.id].status} onChange={e=>updateStatus(job,e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">{STATUSES.map(s=><option key={s}>{s}</option>)}</select><a href={job.url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ExternalLink size={15}/></a><button onClick={()=>updateStatus(job,"")} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-rose-600" title="Remove from tracker"><Trash2 size={15}/></button></div></div>) : <div className="py-16 text-center"><BriefcaseBusiness className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-semibold">Your pipeline is empty</p><p className="mt-1 text-sm text-slate-500">Save roles from Discover to start tracking applications.</p></div>}
          </div>
        </>}
      </div>

      {showAnalyzer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAnalyzer(false);}}>
        <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><div className="flex items-center gap-2 font-bold"><Sparkles size={17} className="text-[#6258e8]"/> Resume match analysis</div><p className="mt-1 text-xs text-slate-500">{selected ? `${selected.company} · ${selected.title}` : "Compare your resume against a target PM role"}</p></div><button onClick={()=>setShowAnalyzer(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2">
            <div className="space-y-4 border-b border-slate-100 p-5 md:border-b-0 md:border-r">
              <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">1. Upload your resume</label><button onClick={()=>fileRef.current?.click()} className="flex w-full flex-col items-center rounded-xl border border-dashed border-violet-300 bg-violet-50/60 px-4 py-6 text-center hover:bg-violet-50"><UploadCloud className="mb-2 text-[#6258e8]" size={23}/><span className="text-sm font-semibold text-slate-800">{resumeFile ? resumeFile.name : "Choose PDF, DOCX or TXT"}</span><span className="mt-1 text-[11px] text-slate-500">Maximum 8 MB · Processed by this app's server</span></button><input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e=>setResumeFile(e.target.files?.[0] ?? null)}/></div>
              <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">2. Job description</label><textarea value={jdText} onChange={e=>setJdText(e.target.value)} rows={10} placeholder="Paste the complete job description here…" className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-violet-400"/></div>
              {analysisError && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{analysisError}</div>}
              <button disabled={analyzing} onClick={runAnalysis} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#6258e8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5147d5] disabled:opacity-60">{analyzing ? <><Loader2 size={16} className="animate-spin"/> Analysing resume…</> : <><Sparkles size={16}/> Analyse match</>}</button>
              <p className="text-[10px] leading-4 text-slate-400">Your resume is processed for this analysis and is not saved in a database by this starter app. If you enable OpenAI, extracted resume text and the job description are sent to OpenAI for feedback.</p>
            </div>
            <div className="min-h-[360px] bg-slate-50/70 p-5">
              {!analysis ? <div className="flex h-full min-h-[330px] flex-col items-center justify-center text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-[#6258e8]"><FileSearch size={25}/></div><div className="font-semibold text-slate-800">Your analysis will appear here</div><p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">We'll assess skill alignment, highlight missing evidence and suggest ways to strengthen your application.</p></div> : <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"><div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-full" style={{background:`conic-gradient(#6258e8 ${analysis.score*3.6}deg,#e9eaf2 0deg)`}}><div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white text-2xl font-bold">{analysis.score}</div></div><div><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated match</div><div className="mt-1 text-lg font-bold">{analysis.verdict}</div><div className="mt-1 text-[11px] text-slate-500">Evidence-based heuristic score</div></div></div>
                <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Skill alignment</h3><div className="space-y-2">{analysis.breakdown.map(x=><div key={x.label}><div className="mb-1 flex justify-between text-[11px]"><span className="font-medium">{x.label}</span><span className="text-slate-500">{x.score}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#6258e8]" style={{width:`${x.score}%`}}/></div></div>)}</div></div>
                <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Strengths</h3>{analysis.strengths.map((x,i)=><p key={i} className="mb-2 flex gap-2 text-xs leading-5 text-slate-700"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600"/>{x}</p>)}</div>
                <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Areas to improve</h3>{analysis.improvements.map((x,i)=><p key={i} className="mb-2 flex gap-2 text-xs leading-5 text-slate-700"><CircleDot size={14} className="mt-0.5 shrink-0 text-amber-500"/>{x}</p>)}</div>
                {aiFeedback && <div className="rounded-xl border border-violet-200 bg-violet-50 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-violet-800"><Sparkles size={14}/> AI hiring-manager feedback</div><p className="whitespace-pre-wrap text-xs leading-5 text-slate-700">{aiFeedback}</p></div>}
                <p className="text-[10px] leading-4 text-slate-400">This is an advisory estimate, not an employer's ATS score or a prediction of interview selection. Validate all suggestions against your real experience.</p>
              </div>}
            </div>
          </div>
        </div>
      </div>}
      <footer className="mx-auto max-w-[1440px] px-5 pb-8 pt-2 text-center text-[10px] text-slate-400 lg:px-8">PM Career Intelligence · Independent job discovery tool · Not affiliated with listed employers</footer>
    </main>
  );
}

function Metric({label,value,icon}:{label:string;value:string;icon:React.ReactNode}) {
  return <div className="rounded-xl border border-white/10 bg-white/[.07] p-3"><div className="flex items-center gap-1.5 text-violet-200">{icon}<span className="text-[10px] font-medium">{label}</span></div><div className="mt-2 text-2xl font-bold">{value}</div></div>;
}
function StatCard({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><span className="rounded-lg bg-violet-50 p-2 text-[#6258e8]">{icon}</span></div><div className="mt-2 text-2xl font-bold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-slate-400">{sub}</div></div>;
}
function JobCard({job,tracked,onStatus,onAnalyze}:{job:Job;tracked?:Tracked;onStatus:(s:string)=>void;onAnalyze:()=>void}) {
  const [expanded,setExpanded] = useState(false);
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-soft">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">{initials(job.company)}</div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold leading-5">{job.title}</h3>{tracked && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{tracked.status}</span>}</div><div className="mt-1 text-xs font-medium text-slate-600">{job.company}</div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><MapPin size={12}/>{job.location}</span><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{timeAgo(job.postedAt)}</span>{job.department && <span>{job.department}</span>}</div></div>
    </div>
    {expanded && <p className="mt-3 line-clamp-5 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">{job.description || "Full description is available on the employer's application page."}</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
      <div className="flex items-center gap-2"><button onClick={()=>setExpanded(!expanded)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">{expanded ? "Hide details" : "Preview role"}</button><span className="text-slate-200">|</span><button onClick={onAnalyze} className="inline-flex items-center gap-1 text-xs font-semibold text-[#6258e8] hover:text-[#4338ca]"><Sparkles size={13}/> Match resume</button></div>
      <div className="flex items-center gap-2"><select aria-label={`Track ${job.title}`} value={tracked?.status ?? ""} onChange={e=>onStatus(e.target.value)} className="max-w-[112px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-600"><option value="">+ Track</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#6258e8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5147d5]">Apply <ArrowUpRight size={13}/></a></div>
    </div>
  </article>;
}
