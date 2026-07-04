'use client';

import { useState } from "react";

const fixes = [
  { id: "routing", label: "Routing & Navigation", desc: "useRouter → useParams/usePathname/useSearchParams" },
  { id: "metadata", label: "Metadata / Head", desc: "next/head → metadata export API" },
  { id: "image", label: "Image Component", desc: "Fix layout prop, missing width/height, alt tags" },
  { id: "link", label: "Link Component", desc: "Remove nested <a> tags inside <Link>" },
  { id: "api", label: "API Routes", desc: "Migrate /pages/api → /app/api/route.ts" },
  { id: "font", label: "Fonts & Scripts", desc: "next/font/google + next/script strategy" },
  { id: "config", label: "next.config.js", desc: "images.domains → remotePatterns, remove deprecated" },
  { id: "packages", label: "Package Versions", desc: "npm-check-updates for next, react, eslint-config-next" },
  { id: "directives", label: "use client / use server", desc: "Add 'use client' to interactive components" },
  { id: "approuter", label: "App Router Migration", desc: "pages/ → app/, _app.tsx → layout.tsx" },
];

const agents = ["Cline", "OpenCode", "Cursor", "Aider", "Roo Code", "Continue.dev", "Other"];

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      background: color,
      color: "#fff",
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em",
    }}>{children}</span>
  );
}

export default function PromptForm() {
  const [projectName, setProjectName] = useState("Snakebet");
  const [projectDir, setProjectDir] = useState("/");
  const [nextVersion, setNextVersion] = useState("15");
  const [agent, setAgent] = useState("Cline");
  const [selected, setSelected] = useState(fixes.map(f => f.id));
  const [extras, setExtras] = useState("");
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelected(fixes.map(f => f.id));
  const clearAll = () => setSelected([]);

  const fixDetails: Record<string, string> = {
    routing: `### 1. Routing & Navigation
- Replace all \`next/router\` useRouter() with \`next/navigation\`:
  - \`router.query\` → \`useParams()\` + \`useSearchParams()\`
  - \`router.pathname\` → \`usePathname()\`
  - Navigation still uses \`useRouter()\` from \`next/navigation\` for push/replace`,
    metadata: `### 2. Metadata
- Replace all \`next/head\` <Head> usage with metadata export:
  \`\`\`ts
  export const metadata = { title: '...', description: '...' }
  \`\`\``,
    image: `### 3. Image Component
- Add required \`width\` and \`height\` props where missing
- Replace \`layout="fill"\` → \`fill\` prop + \`style={{ objectFit: 'cover' }}\`
- Replace \`layout="intrinsic"\` / \`layout="fixed"\` with explicit width/height
- Add \`alt\` props where missing`,
    link: `### 4. Link Component
- Remove nested <a> tags inside <Link>:
  \`\`\`tsx
  // OLD: <Link href="/foo"><a>Click</a></Link>
  // NEW: <Link href="/foo">Click</Link>
  \`\`\``,
    api: `### 5. API Routes
- Migrate \`/pages/api/*\` → \`/app/api/*/route.ts\`:
  \`\`\`ts
  export async function GET(req: Request) { ... }
  export async function POST(req: Request) { ... }
  \`\`\`
  Use NextRequest / NextResponse from \`next/server\``,
    font: `### 6. Fonts & Scripts
- Replace Google Fonts <link> tags in <Head> with \`next/font/google\`
- Replace raw <script> tags with \`next/script\` with appropriate \`strategy\` prop`,
    config: `### 7. next.config.js / next.config.ts
- Remove deprecated \`target\` option
- Replace \`images.domains\` with \`images.remotePatterns\`
- Remove \`experimental.serverActions\` if now stable`,
    packages: `### 8. Package Versions
- Run: \`npx npm-check-updates -u --filter next,react,react-dom,eslint-config-next\`
- Then: \`npm install\`
- Fix any peer dependency warnings`,
    directives: `### 9. 'use client' / 'use server' Directives
- Add \`'use client'\` to any component using:
  - useState, useEffect, useRef, useContext, onClick, onChange etc.
- Keep components without interactivity as Server Components (no directive)`,
    approuter: `### 10. App Router Migration
- Move pages from \`/pages\` to \`/app\` directory
- Replace \`_app.tsx\` / \`_document.tsx\` with \`layout.tsx\`
- Replace \`getServerSideProps\` / \`getStaticProps\` / \`getStaticPaths\` with server components + fetch()`,
  };

  const generatePrompt = () => {
    const projectLine = projectName ? `Project: ${projectName}` : "Project: (not specified)";
    const selectedFixes = fixes.filter(f => selected.includes(f.id));
    const fixBlocks = selectedFixes.map(f => fixDetails[f.id]).join("\n\n");

    return `You are a Next.js ${nextVersion} migration expert. Audit the entire codebase and fix ALL outdated Next.js patterns. Do NOT ask for confirmation — just fix everything.

${projectLine}
Scan directory: \`${projectDir}\`
Agent: ${agent}

## FIXES TO APPLY:

${fixBlocks}

## PROCESS:
1. Start with \`package.json\` — check Next.js version
2. Scan ALL files under \`${projectDir}\`
3. Fix every issue listed above systematically, file by file
4. After all fixes, run \`npx next build\` and fix any remaining type/lint errors
5. Report a summary of every file changed with what was fixed${extras ? `\n\n## ADDITIONAL INSTRUCTIONS:\n${extras}` : ""}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dark = "#0D1117";
  const card = "#161B22";
  const border = "#30363D";
  const accent = "#4F8EF7";
  const green = "#3FB950";
  const muted = "#8B949E";

  return (
    <div style={{ minHeight: "100vh", background: dark, color: "#E6EDF3", fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Next.js Fix Prompt Generator
            </h1>
          </div>
          <p style={{ color: muted, margin: 0, fontSize: 14 }}>
            Fill in your project details → get a copy-paste ready agent prompt
          </p>
        </div>

        {/* Project Details */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Project Details
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: muted, marginBottom: 6 }}>Project Name</label>
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Snakebet"
                style={{
                  width: "100%", boxSizing: "border-box", background: dark, border: `1px solid ${border}`,
                  borderRadius: 8, padding: "10px 12px", color: "#E6EDF3", fontSize: 14, outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: muted, marginBottom: 6 }}>Scan Directory</label>
              <input
                value={projectDir}
                onChange={e => setProjectDir(e.target.value)}
                placeholder="/src or /app"
                style={{
                  width: "100%", boxSizing: "border-box", background: dark, border: `1px solid ${border}`,
                  borderRadius: 8, padding: "10px 12px", color: "#E6EDF3", fontSize: 14, outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: muted, marginBottom: 6 }}>Next.js Version Target</label>
              <select
                value={nextVersion}
                onChange={e => setNextVersion(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", background: dark, border: `1px solid ${border}`,
                  borderRadius: 8, padding: "10px 12px", color: "#E6EDF3", fontSize: 14, outline: "none"
                }}
              >
                <option value="13">13 (App Router intro)</option>
                <option value="14">14</option>
                <option value="15">15 (latest)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: muted, marginBottom: 6 }}>AI Agent / Tool</label>
              <select
                value={agent}
                onChange={e => setAgent(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", background: dark, border: `1px solid ${border}`,
                  borderRadius: 8, padding: "10px 12px", color: "#E6EDF3", fontSize: 14, outline: "none"
                }}
              >
                {agents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Fix Selection */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Select Fixes
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={selectAll} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 12px", color: accent, fontSize: 12, cursor: "pointer" }}>
                All
              </button>
              <button onClick={clearAll} style={{ background: "transparent", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 12px", color: muted, fontSize: 12, cursor: "pointer" }}>
                Clear
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fixes.map(fix => {
              const active = selected.includes(fix.id);
              return (
                <div
                  key={fix.id}
                  onClick={() => toggle(fix.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: `1px solid ${active ? accent + "55" : border}`,
                    background: active ? accent + "11" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${active ? accent : border}`,
                    background: active ? accent : "transparent", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? "#E6EDF3" : muted }}>{fix.label}</div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{fix.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: muted }}>
            {selected.length} / {fixes.length} fixes selected
          </div>
        </div>

        {/* Extra Instructions */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Extra Instructions <span style={{ color: border, fontWeight: 400 }}>(optional)</span>
          </h2>
          <textarea
            value={extras}
            onChange={e => setExtras(e.target.value)}
            placeholder="e.g. Also fix Prisma client imports, keep NextAuth v5 syntax, don't touch /app/admin routes..."
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", background: dark, border: `1px solid ${border}`,
              borderRadius: 8, padding: "10px 12px", color: "#E6EDF3", fontSize: 14,
              outline: "none", resize: "vertical", fontFamily: "inherit"
            }}
          />
        </div>

        {/* Generated Prompt */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Generated Prompt
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Badge color={selected.length > 0 ? green : "#6E7681"}>{selected.length} fixes</Badge>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? green : accent,
                  border: "none", borderRadius: 8, padding: "8px 18px",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "background 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Prompt"}
              </button>
            </div>
          </div>
          <pre style={{
            background: dark, border: `1px solid ${border}`, borderRadius: 8,
            padding: 16, margin: 0, fontSize: 12, lineHeight: 1.6,
            color: "#A8C5E8", overflowX: "auto", whiteSpace: "pre-wrap",
            maxHeight: 320, overflowY: "auto",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
            {generatePrompt()}
          </pre>
        </div>

      </div>
    </div>
  );
}
