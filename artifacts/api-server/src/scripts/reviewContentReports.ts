import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { contentReports, db, pool } from "@workspace/db";
import { readReportPortrait } from "../lib/journalPortraits";

const [command = "--list", id, ...rest] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function run() {
  if (command === "--list") {
    const rows = await db.select({
      id: contentReports.id, surface: contentReports.surface, reason: contentReports.reason,
      status: contentReports.status, createdAt: contentReports.createdAt,
    }).from(contentReports).where(eq(contentReports.status, "pending")).orderBy(desc(contentReports.createdAt)).limit(50);
    console.table(rows);
    return;
  }
  if (!id || !uuid.test(id) || !["--show", "--export", "--resolve"].includes(command)) {
    throw new Error("Use --list, --show <id>, --export <id>, or --resolve <id> --note <review outcome>.");
  }
  const [report] = await db.select().from(contentReports).where(eq(contentReports.id, id));
  if (!report) throw new Error("Report not found.");
  if (command === "--show") {
    console.log(JSON.stringify({ ...report, payloadHash: undefined }, null, 2));
  } else if (command === "--export") {
    const image = report.portraitPath ? await readReportPortrait(report.portraitPath) : null;
    const directory = path.resolve("generated-artifacts/private-report-reviews");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = path.join(directory, `${id}.html`);
    await writeFile(file, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'">
<title>Private Chirrup report</title><style>body{max-width:820px;margin:24px auto;padding:20px;font:16px/1.5 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style>
<h1>Private developer review</h1><p>Potentially offensive user-reported content. Do not publish or forward this file.</p>
<pre>${escape(JSON.stringify({ ...report, payloadHash: undefined, portraitPath: undefined }, null, 2))}</pre>
${image ? `<img alt="Reported generated picture" src="${image}">` : "<p>No picture attached.</p>"}</html>`, { mode: 0o600 });
    console.log(`Private review saved to ${file}. It is excluded from Git and publishing.`);
  } else {
    const note = rest[0] === "--note" ? rest.slice(1).join(" ").trim() : "";
    if (note.length < 10 || note.length > 2000) throw new Error("Describe the review outcome and any safety/filtering action in 10–2000 characters.");
    await db.update(contentReports).set({ status: "reviewed", reviewNotes: note, reviewedAt: new Date() })
      .where(eq(contentReports.id, id));
    console.log("Review outcome recorded. This does not silently change the generator or delete anyone's birds.");
  }
}
run().catch(error => { console.error(error instanceof Error ? error.message : "Review failed."); process.exitCode = 1; }).finally(() => pool.end());
