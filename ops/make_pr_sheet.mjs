/* Renders `make_pr_sheet.html` to the one-page PR summary PDF.
 *
 * Chrome rather than a PDF library: this machine has no reportlab, and the
 * sheet is laid out in CSS, so the browser that already renders it is the
 * thing best placed to print it. System Chrome via `channel`, because
 * Playwright's bundled Chromium is not installed here.
 *
 *   node make_pr_sheet.mjs        (needs playwright; `pnpm add playwright`)
 *
 * The PR list inside the HTML is a point-in-time snapshot — check it against
 * `gh pr list` before trusting a regenerated copy.
 */
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage();
await p.goto("file://" + join(here, "make_pr_sheet.html"), { waitUntil: "networkidle" });
const out = join(here, "JTrax - open pull requests.pdf");
await p.pdf({ path: out, format: "A4", printBackground: true });
await b.close();
console.log("wrote", out);
