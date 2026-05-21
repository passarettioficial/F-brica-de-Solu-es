import { jsPDF } from "jspdf";

const PRIMARY = "#1A3FAB";
const FG = "#0F1530";
const MUTED = "#6B7383";
const ACCENT = "#FF8C42";
const RULE = "#E5E8F0";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 56;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

type LineToken = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function tokenizeInline(line: string): LineToken[] {
  const tokens: LineToken[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) tokens.push({ text: line.slice(last, m.index) });
    if (m[2]) tokens.push({ text: m[2], bold: true });
    else if (m[4]) tokens.push({ text: m[4], italic: true });
    else if (m[6]) tokens.push({ text: m[6], code: true });
    last = re.lastIndex;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens.length ? tokens : [{ text: line }];
}

function stripMd(line: string): string {
  return line.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

class PdfRenderer {
  doc: jsPDF;
  y: number = MARGIN_TOP;
  pageNum: number = 1;
  projectName: string;
  pageTitle: string;

  constructor(projectName: string, pageTitle: string) {
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.projectName = projectName;
    this.pageTitle = pageTitle;
    this.drawHeaderFooter();
  }

  private drawHeaderFooter() {
    const d = this.doc;
    // Header rule + brand mark
    d.setDrawColor(RULE);
    d.setLineWidth(0.5);
    d.line(MARGIN_X, 40, PAGE_W - MARGIN_X, 40);
    d.setFont("helvetica", "bold");
    d.setFontSize(9);
    d.setTextColor(PRIMARY);
    d.text("FOUNDERSFLOW", MARGIN_X, 32);
    d.setFont("helvetica", "normal");
    d.setTextColor(MUTED);
    d.setFontSize(8);
    const right = this.pageTitle.length > 60 ? this.pageTitle.slice(0, 57) + "..." : this.pageTitle;
    d.text(right, PAGE_W - MARGIN_X, 32, { align: "right" });

    // Footer
    d.setDrawColor(RULE);
    d.line(MARGIN_X, PAGE_H - 36, PAGE_W - MARGIN_X, PAGE_H - 36);
    d.setFontSize(8);
    d.setTextColor(MUTED);
    d.text(this.projectName, MARGIN_X, PAGE_H - 22);
    d.text(`${this.pageNum}`, PAGE_W - MARGIN_X, PAGE_H - 22, { align: "right" });
  }

  ensure(spaceNeeded: number) {
    if (this.y + spaceNeeded > PAGE_H - MARGIN_BOTTOM) {
      this.doc.addPage();
      this.pageNum += 1;
      this.y = MARGIN_TOP;
      this.drawHeaderFooter();
    }
  }

  gap(h: number) { this.y += h; }

  rule() {
    this.ensure(12);
    this.doc.setDrawColor(RULE);
    this.doc.setLineWidth(0.5);
    this.doc.line(MARGIN_X, this.y, PAGE_W - MARGIN_X, this.y);
    this.gap(10);
  }

  setBody() {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(FG);
  }

  drawHeading(text: string, level: 1 | 2 | 3 | 4) {
    const sizes: Record<number, number> = { 1: 22, 2: 16, 3: 13, 4: 11 };
    const sz = sizes[level];
    this.gap(level === 1 ? 14 : level === 2 ? 12 : 8);
    this.ensure(sz + 8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(sz);
    this.doc.setTextColor(level <= 2 ? PRIMARY : FG);
    const lines = this.doc.splitTextToSize(stripMd(text), CONTENT_W);
    for (const ln of lines) {
      this.ensure(sz);
      this.doc.text(ln, MARGIN_X, this.y);
      this.y += sz + 2;
    }
    if (level === 1) {
      // accent underline
      this.gap(2);
      this.doc.setDrawColor(ACCENT);
      this.doc.setLineWidth(2);
      this.doc.line(MARGIN_X, this.y, MARGIN_X + 40, this.y);
      this.gap(8);
    } else {
      this.gap(4);
    }
    this.setBody();
  }

  drawParagraph(text: string) {
    if (!text.trim()) return;
    const tokens = tokenizeInline(text);
    this.drawTokens(tokens, MARGIN_X);
    this.gap(6);
  }

  drawListItem(text: string, ordered: boolean, idx: number, indent: number = 0) {
    const bulletX = MARGIN_X + indent;
    const textX = bulletX + 14;
    const w = CONTENT_W - 14 - indent;
    this.ensure(13 + 4);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(PRIMARY);
    this.doc.text(ordered ? `${idx}.` : "•", bulletX, this.y);
    const tokens = tokenizeInline(text);
    this.drawTokens(tokens, textX, w);
    this.gap(2);
  }

  drawCode(lines: string[]) {
    const lineH = 11;
    const padY = 6;
    this.doc.setFont("courier", "normal");
    this.doc.setFontSize(9);
    const wrappedAll: string[] = [];
    for (const ln of lines) {
      const w = this.doc.splitTextToSize(ln, CONTENT_W - 16);
      for (const wl of w) wrappedAll.push(wl);
    }
    if (wrappedAll.length === 0) wrappedAll.push("");
    const maxRowsPerPage = Math.floor((PAGE_H - MARGIN_BOTTOM - MARGIN_TOP - padY * 2) / lineH);
    let idx = 0;
    while (idx < wrappedAll.length) {
      const availRows = Math.max(1, Math.floor((PAGE_H - MARGIN_BOTTOM - this.y - padY * 2) / lineH));
      const rows = Math.min(wrappedAll.length - idx, availRows);
      if (rows < 1) {
        this.ensure(PAGE_H);
        continue;
      }
      const block = rows * lineH + padY * 2;
      this.doc.setFillColor(245, 246, 250);
      this.doc.setDrawColor(RULE);
      this.doc.roundedRect(MARGIN_X, this.y, CONTENT_W, block, 4, 4, "FD");
      this.doc.setFont("courier", "normal");
      this.doc.setFontSize(9);
      this.doc.setTextColor(FG);
      let yy = this.y + padY + 8;
      for (let k = 0; k < rows; k++) {
        this.doc.text(wrappedAll[idx + k], MARGIN_X + 8, yy);
        yy += lineH;
      }
      this.y += block + 6;
      idx += rows;
      if (idx < wrappedAll.length) {
        this.ensure(PAGE_H);
        // Force new page for remainder if we couldn't fit one row
        if (PAGE_H - MARGIN_BOTTOM - this.y < lineH + padY * 2) {
          this.doc.addPage();
          this.pageNum += 1;
          this.y = MARGIN_TOP;
          this.drawHeaderFooter();
        }
      }
      // Safety: avoid infinite loop on absurdly tall pages
      if (rows === maxRowsPerPage && idx < wrappedAll.length) {
        this.doc.addPage();
        this.pageNum += 1;
        this.y = MARGIN_TOP;
        this.drawHeaderFooter();
      }
    }
    this.setBody();
  }

  drawQuote(text: string) {
    const stripped = stripMd(text);
    const lines = this.doc.splitTextToSize(stripped, CONTENT_W - 16);
    const h = lines.length * 13 + 10;
    this.ensure(h);
    this.doc.setDrawColor(PRIMARY);
    this.doc.setLineWidth(3);
    this.doc.line(MARGIN_X, this.y, MARGIN_X, this.y + h - 4);
    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(MUTED);
    let yy = this.y + 10;
    for (const ln of lines) {
      this.doc.text(ln, MARGIN_X + 12, yy);
      yy += 13;
    }
    this.y += h + 4;
    this.setBody();
  }

  private drawTokens(tokens: LineToken[], x: number, w: number = CONTENT_W - (x - MARGIN_X)) {
    const lineH = 13;
    const fontSize = 10.5;
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(FG);

    // Expand tokens into per-word fragments with style intact
    type Frag = { text: string; style: LineToken; isSpace: boolean };
    const frags: Frag[] = [];
    for (const t of tokens) {
      const parts = t.text.split(/(\s+)/);
      for (const p of parts) {
        if (!p) continue;
        frags.push({ text: p, style: t, isSpace: /^\s+$/.test(p) });
      }
    }

    const setFontFor = (s: LineToken) => {
      if (s.code) { this.doc.setFont("courier", s.bold ? "bold" : "normal"); return; }
      const weight = s.bold ? "bold" : "normal";
      const style = s.italic ? "italic" : weight;
      // jsPDF helvetica supports: normal, bold, italic, bolditalic
      const variant = s.bold && s.italic ? "bolditalic" : (s.italic ? "italic" : weight);
      this.doc.setFont("helvetica", variant);
    };

    const measure = (text: string, style: LineToken): number => {
      setFontFor(style);
      return this.doc.getTextWidth(text);
    };

    // Greedy line packing
    let line: Frag[] = [];
    let lineW = 0;
    const flushLine = () => {
      this.ensure(lineH);
      let cx = x;
      for (const f of line) {
        setFontFor(f.style);
        if (f.style.code) {
          // light bg behind inline code
          const w2 = this.doc.getTextWidth(f.text);
          this.doc.setFillColor(245, 246, 250);
          this.doc.rect(cx - 1, this.y - 9, w2 + 2, 12, "F");
          this.doc.setTextColor(FG);
        } else {
          this.doc.setTextColor(FG);
        }
        this.doc.text(f.text, cx, this.y);
        cx += this.doc.getTextWidth(f.text);
      }
      this.y += lineH;
      line = [];
      lineW = 0;
    };

    for (const f of frags) {
      const fw = measure(f.text, f.style);
      if (lineW + fw > w && line.length > 0) {
        // strip trailing space
        while (line.length && line[line.length - 1].isSpace) line.pop();
        flushLine();
        if (f.isSpace) continue;
      }
      line.push(f);
      lineW += fw;
    }
    if (line.length) flushLine();
    this.doc.setFont("helvetica", "normal");
  }

  drawMarkdown(md: string) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let i = 0;
    let orderedIdx = 0;
    let inList = false;
    while (i < lines.length) {
      const ln = lines[i];
      // Code block
      if (/^```/.test(ln)) {
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        if (buf.length) this.drawCode(buf);
        inList = false;
        continue;
      }
      const heading = ln.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        this.drawHeading(heading[2], heading[1].length as 1 | 2 | 3 | 4);
        inList = false;
        orderedIdx = 0;
        i++;
        continue;
      }
      if (/^---+\s*$/.test(ln)) {
        this.rule();
        inList = false;
        i++;
        continue;
      }
      const quote = ln.match(/^>\s?(.*)$/);
      if (quote) {
        const buf: string[] = [quote[1]];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        this.drawQuote(buf.join(" "));
        inList = false;
        continue;
      }
      const olItem = ln.match(/^(\s*)(\d+)\.\s+(.+)$/);
      const ulItem = ln.match(/^(\s*)[-*+]\s+(.+)$/);
      if (olItem) {
        if (!inList) { inList = true; orderedIdx = 0; }
        orderedIdx++;
        this.drawListItem(olItem[3], true, orderedIdx, Math.min(olItem[1].length * 4, 24));
        i++;
        continue;
      }
      if (ulItem) {
        inList = true;
        this.drawListItem(ulItem[2], false, 0, Math.min(ulItem[1].length * 4, 24));
        i++;
        continue;
      }
      if (!ln.trim()) {
        if (inList) { this.gap(4); inList = false; orderedIdx = 0; }
        else this.gap(4);
        i++;
        continue;
      }
      // paragraph: collect until blank
      const buf: string[] = [ln];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s|-{3,}|\d+\.\s|[-*+]\s)/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      this.drawParagraph(buf.join(" "));
      inList = false;
      orderedIdx = 0;
    }
    this.setBody();
  }

  drawCover(title: string, subtitle: string, meta: Array<{ label: string; value: string }>) {
    const d = this.doc;
    const cy = PAGE_H * 0.32;
    d.setFont("helvetica", "bold");
    d.setFontSize(9);
    d.setTextColor(PRIMARY);
    d.text("FOUNDERSFLOW · EXPORT", MARGIN_X, cy - 40);
    d.setFont("helvetica", "bold");
    d.setFontSize(34);
    d.setTextColor(FG);
    const titleLines = d.splitTextToSize(title, CONTENT_W);
    let yy = cy;
    for (const tl of titleLines) {
      d.text(tl, MARGIN_X, yy);
      yy += 38;
    }
    d.setDrawColor(ACCENT);
    d.setLineWidth(3);
    d.line(MARGIN_X, yy + 4, MARGIN_X + 60, yy + 4);
    yy += 24;
    d.setFont("helvetica", "normal");
    d.setFontSize(12);
    d.setTextColor(MUTED);
    const subLines = d.splitTextToSize(subtitle, CONTENT_W);
    for (const sl of subLines) {
      d.text(sl, MARGIN_X, yy);
      yy += 16;
    }
    yy += 30;
    for (const m of meta) {
      d.setFont("helvetica", "bold");
      d.setFontSize(9);
      d.setTextColor(MUTED);
      d.text(m.label.toUpperCase(), MARGIN_X, yy);
      d.setFont("helvetica", "normal");
      d.setFontSize(11);
      d.setTextColor(FG);
      d.text(m.value, MARGIN_X + 160, yy);
      yy += 18;
    }
    this.doc.addPage();
    this.pageNum += 1;
    this.y = MARGIN_TOP;
    this.drawHeaderFooter();
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

function safeFilename(s: string): string {
  return (s || "")
    .replace(/[^a-z0-9\-_]+/gi, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "documento";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function downloadArtifactPdf(opts: {
  artifactKey: string;
  artifactLabel: string;
  content: string;
  projectName: string;
  phaseNumber: number;
}) {
  const pageTitle = `Fase ${opts.phaseNumber} · ${opts.artifactLabel}`;
  const r = new PdfRenderer(opts.projectName, pageTitle);
  r.drawHeading(opts.artifactLabel, 1);
  r.drawParagraph(`Projeto: ${opts.projectName} · Fase ${opts.phaseNumber} · ${todayISO()}`);
  r.rule();
  r.drawMarkdown(opts.content);
  r.gap(20);
  r.rule();
  r.drawParagraph("Gerado por FoundersFlow · foundersflow.com.br");
  r.save(`${safeFilename(opts.projectName)}-${safeFilename(opts.artifactKey)}-${todayISO()}.pdf`);
}

export function downloadProjectPdf(opts: {
  projectName: string;
  briefing?: string | null;
  phases: Array<{
    phaseNumber: number;
    name: string;
    status: string;
    artifacts: Array<{ artifactKey: string; label: string; content: string }>;
  }>;
}) {
  const completed = opts.phases.filter((p) => p.status === "completed").length;
  const r = new PdfRenderer(opts.projectName, opts.projectName);
  r.drawCover(opts.projectName, "Documentação completa das 7 fases — gerada pela plataforma.", [
    { label: "Data", value: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) },
    { label: "Fases concluídas", value: `${completed} de 7` },
    { label: "Gerado por", value: "FoundersFlow" },
  ]);

  if (opts.briefing?.trim()) {
    r.drawHeading("Briefing", 2);
    r.drawMarkdown(opts.briefing.trim());
    r.gap(10);
  }

  const PHASE_EMOJI: Record<string, string> = { completed: "[OK]", active: "[ATIVA]", locked: "[BLOQ]" };
  for (const phase of opts.phases) {
    const arts = phase.artifacts.filter((a) => a.content?.trim());
    if (arts.length === 0) continue;
    r.rule();
    r.drawHeading(`Fase ${phase.phaseNumber} — ${phase.name}`, 2);
    r.drawParagraph(`Status: ${PHASE_EMOJI[phase.status] ?? phase.status} · ${arts.length} entregável(eis)`);
    for (const art of arts) {
      r.drawHeading(art.label || art.artifactKey, 3);
      r.drawMarkdown(art.content);
      r.gap(8);
    }
  }

  r.gap(20);
  r.rule();
  r.drawParagraph("Gerado por FoundersFlow · foundersflow.com.br");
  r.save(`foundersflow-${safeFilename(opts.projectName)}-${todayISO()}.pdf`);
}
