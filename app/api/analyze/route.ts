import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { analyzeResume } from "@/lib/matcher";

export const runtime = "nodejs";

async function extractResume(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text ?? "";
  }
  if (name.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value ?? "";
  }
  if (name.endsWith(".txt")) return buffer.toString("utf8");
  throw new Error("Unsupported file. Upload a PDF, DOCX or TXT file.");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume");
    const jd = String(form.get("jobDescription") ?? "").trim();
    if (!(file instanceof File)) return NextResponse.json({ error: "Please upload your resume." }, { status: 400 });
    if (!jd) return NextResponse.json({ error: "Paste the complete job description to run a comparison." }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Resume must be smaller than 8 MB." }, { status: 400 });

    const resumeText = await extractResume(file);
    if (resumeText.trim().length < 100) {
      return NextResponse.json({ error: "Not enough readable text was extracted. Try a text-based PDF or DOCX, or paste the resume text into a TXT file." }, { status: 422 });
    }

    const result = analyzeResume(resumeText, jd);
    let aiFeedback: string | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            input: [
              { role: "system", content: "You are a rigorous senior product-management hiring manager. Give concise, evidence-based resume feedback. Do not invent experience. Distinguish missing evidence from missing capability. Return 3 prioritized improvements and 2 example bullet rewrites using only facts present in the resume." },
              { role: "user", content: `JOB DESCRIPTION:\n${jd.slice(0, 14000)}\n\nRESUME:\n${resumeText.slice(0, 14000)}\n\nProvide prioritized feedback.` }
            ]
          })
        });
        if (response.ok) {
          const data = await response.json();
          aiFeedback = data.output?.flatMap((o: any) => o.content ?? []).map((c: any) => c.text ?? "").filter(Boolean).join("\n") || null;
        }
      } catch (e) {
        console.warn("Optional AI feedback failed; deterministic analysis remains available.", e);
      }
    }
    return NextResponse.json({ result, aiFeedback, extractedCharacters: resumeText.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
