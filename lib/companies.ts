export type Provider = "greenhouse" | "ashby" | "lever";

export type CompanyBoard = {
  company: string;
  provider: Provider;
  slug: string;
  careersUrl: string;
  tier?: string;
};

// These are public ATS board identifiers, not endorsements or partnerships.
// Add or remove companies here. A board may temporarily return no jobs or change its slug.
export const DEFAULT_BOARDS: CompanyBoard[] = [
  { company: "Airbnb", provider: "greenhouse", slug: "airbnb", careersUrl: "https://careers.airbnb.com/", tier: "Top tech" },
  { company: "Anthropic", provider: "greenhouse", slug: "anthropic", careersUrl: "https://www.anthropic.com/careers", tier: "AI" },
  { company: "Cloudflare", provider: "greenhouse", slug: "cloudflare", careersUrl: "https://www.cloudflare.com/careers/", tier: "Top tech" },
  { company: "Coinbase", provider: "greenhouse", slug: "coinbase", careersUrl: "https://www.coinbase.com/careers", tier: "Top tech" },
  { company: "Databricks", provider: "greenhouse", slug: "databricks", careersUrl: "https://www.databricks.com/company/careers", tier: "AI / Data" },
  { company: "Datadog", provider: "greenhouse", slug: "datadog", careersUrl: "https://careers.datadoghq.com/", tier: "Top tech" },
  { company: "Discord", provider: "greenhouse", slug: "discord", careersUrl: "https://discord.com/careers", tier: "Top tech" },
  { company: "Figma", provider: "greenhouse", slug: "figma", careersUrl: "https://www.figma.com/careers/", tier: "Top tech" },
  { company: "Instacart", provider: "greenhouse", slug: "instacart", careersUrl: "https://instacart.careers/", tier: "Top tech" },
  { company: "Reddit", provider: "greenhouse", slug: "reddit", careersUrl: "https://www.redditinc.com/careers", tier: "Top tech" },
  { company: "Scale AI", provider: "greenhouse", slug: "scaleai", careersUrl: "https://scale.com/careers", tier: "AI" },
  { company: "Stripe", provider: "greenhouse", slug: "stripe", careersUrl: "https://stripe.com/jobs", tier: "Top tech" },
  { company: "Vercel", provider: "greenhouse", slug: "vercel", careersUrl: "https://vercel.com/careers", tier: "Top tech" },
  { company: "Dropbox", provider: "greenhouse", slug: "dropbox", careersUrl: "https://jobs.dropbox.com/", tier: "Top tech" },
  { company: "Robinhood", provider: "greenhouse", slug: "robinhood", careersUrl: "https://careers.robinhood.com/", tier: "Fintech" },
  { company: "Block", provider: "greenhouse", slug: "block", careersUrl: "https://block.xyz/careers", tier: "Fintech" },
  { company: "Lyft", provider: "greenhouse", slug: "lyft", careersUrl: "https://www.lyft.com/careers", tier: "Top tech" },
  { company: "Pinterest", provider: "greenhouse", slug: "pinterest", careersUrl: "https://www.pinterestcareers.com/", tier: "Top tech" },
  { company: "Twilio", provider: "greenhouse", slug: "twilio", careersUrl: "https://www.twilio.com/en-us/company/jobs", tier: "Top tech" },
  { company: "MongoDB", provider: "greenhouse", slug: "mongodb", careersUrl: "https://www.mongodb.com/company/careers", tier: "Top tech" },
  { company: "GitLab", provider: "greenhouse", slug: "gitlab", careersUrl: "https://about.gitlab.com/jobs/", tier: "Remote-first" },
  { company: "Asana", provider: "greenhouse", slug: "asana", careersUrl: "https://asana.com/jobs", tier: "Top tech" },
  { company: "Okta", provider: "greenhouse", slug: "okta", careersUrl: "https://www.okta.com/company/careers/", tier: "Top tech" },
  { company: "DoorDash", provider: "greenhouse", slug: "doordash", careersUrl: "https://careers.doordash.com/", tier: "Top tech" },
  { company: "Glean", provider: "greenhouse", slug: "glean", careersUrl: "https://www.glean.com/careers", tier: "AI" },
  { company: "OpenAI", provider: "ashby", slug: "openai", careersUrl: "https://openai.com/careers/", tier: "AI" },
  { company: "Ramp", provider: "ashby", slug: "ramp", careersUrl: "https://ramp.com/careers", tier: "Fintech" },
  { company: "Linear", provider: "ashby", slug: "linear", careersUrl: "https://linear.app/careers", tier: "Product-led" },
  { company: "Notion", provider: "ashby", slug: "notion", careersUrl: "https://www.notion.com/careers", tier: "Product-led" },
  { company: "Cursor", provider: "ashby", slug: "cursor", careersUrl: "https://www.cursor.com/careers", tier: "AI" },
  { company: "Perplexity", provider: "ashby", slug: "perplexity", careersUrl: "https://www.perplexity.ai/careers", tier: "AI" },
  { company: "Supabase", provider: "ashby", slug: "supabase", careersUrl: "https://supabase.com/careers", tier: "Developer tools" },
  { company: "Plaid", provider: "ashby", slug: "plaid", careersUrl: "https://plaid.com/careers/", tier: "Fintech" },
  { company: "Snowflake", provider: "ashby", slug: "snowflake", careersUrl: "https://careers.snowflake.com/", tier: "AI / Data" },
  { company: "Confluent", provider: "ashby", slug: "confluent", careersUrl: "https://www.confluent.io/careers/", tier: "Developer tools" },
  { company: "Sentry", provider: "ashby", slug: "sentry", careersUrl: "https://sentry.io/careers/", tier: "Developer tools" }
];

export function getBoards(): CompanyBoard[] {
  const raw = process.env.JOB_BOARDS;
  if (!raw) return DEFAULT_BOARDS;
  try {
    const custom = JSON.parse(raw) as CompanyBoard[];
    if (!Array.isArray(custom)) return DEFAULT_BOARDS;
    return custom.filter((b) => b.company && b.slug && ["greenhouse", "ashby", "lever"].includes(b.provider));
  } catch {
    console.error("Invalid JOB_BOARDS JSON; using built-in registry.");
    return DEFAULT_BOARDS;
  }
}
