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
    this.drawWatermark();
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

    // Footer — viral attribution always visible
    d.setDrawColor(RULE);
    d.line(MARGIN_X, PAGE_H - 36, PAGE_W - MARGIN_X, PAGE_H - 36);
    d.setFontSize(8);
    d.setTextColor(MUTED);
    d.text(this.projectName, MARGIN_X, PAGE_H - 22);
    d.setFont("helvetica", "bold");
    d.setTextColor(PRIMARY);
    d.text("foundersflow.com.br", PAGE_W / 2, PAGE_H - 22, { align: "center" });
    d.setFont("helvetica", "normal");
    d.setTextColor(MUTED);
    d.text(`${this.pageNum}`, PAGE_W - MARGIN_X, PAGE_H - 22, { align: "right" });
  }

  private drawWatermark() {
    const d = this.doc;
    // Diagonal subtle watermark — light grey, behind content
    const dd = d as unknown as { saveGraphicsState: () => void; restoreGraphicsState: () => void; setGState: (g: unknown) => void; GState: (opts: { opacity: number }) => unknown };
    dd.saveGraphicsState();
    dd.setGState(dd.GState({ opacity: 0.05 }));
    d.setFont("helvetica", "bold");
    d.setFontSize(64);
    d.setTextColor(PRIMARY);
    d.text("FOUNDERSFLOW", PAGE_W / 2, PAGE_H / 2 + 20, { align: "center", angle: -28 });
    dd.restoreGraphicsState();
  }

  private newContentPage() {
    this.doc.addPage();
    this.pageNum += 1;
    this.y = MARGIN_TOP;
    this.drawWatermark();
    this.drawHeaderFooter();
  }

  ensure(spaceNeeded: number) {
    if (this.y + spaceNeeded > PAGE_H - MARGIN_BOTTOM) {
      this.newContentPage();
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
          this.newContentPage();
        }
      }
      // Safety: avoid infinite loop on absurdly tall pages
      if (rows === maxRowsPerPage && idx < wrappedAll.length) {
        this.newContentPage();
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

  tryDrawStructured(jsonText: string): boolean {
    let data: any;
    try { data = JSON.parse(jsonText); } catch { return false; }
    if (!data || typeof data !== "object") return false;
    if (Array.isArray(data.stories) && data.stories.some((s: any) => s && (s.persona || s.acao || s.id))) {
      this.drawUserStoriesTable(data.stories.filter((s: any) => s && typeof s === "object"));
      return true;
    }
    if (Array.isArray(data.casos) && data.casos.some((c: any) => c && (c.titulo || c.id))) {
      this.drawCasosTesteTable(data.casos.filter((c: any) => c && typeof c === "object"), data.distribuicao_alvo);
      return true;
    }
    if (Array.isArray(data.milestones) && data.milestones.some((m: any) => m && (m.nome || m.numero != null))) {
      this.drawMilestonesTable(data.milestones.filter((m: any) => m && typeof m === "object"), data.duracao_total_estimada, data.marco_mvp);
      return true;
    }
    return false;
  }

  private drawBadge(text: string, x: number, y: number, bg: string): number {
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.5);
    const w = this.doc.getTextWidth(text) + 8;
    this.doc.setFillColor(bg);
    this.doc.roundedRect(x, y - 9, w, 12, 2, 2, "F");
    this.doc.setTextColor("#FFFFFF");
    this.doc.text(text, x + 4, y);
    return w;
  }

  private cardOpen(totalH: number, accentColor?: string): { innerX: number; innerW: number; startY: number } {
    if (this.y + totalH > PAGE_H - MARGIN_BOTTOM) {
      this.newContentPage();
    }
    this.doc.setDrawColor(RULE);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(MARGIN_X, this.y, CONTENT_W, totalH, 4, 4, "S");
    if (accentColor) {
      this.doc.setFillColor(accentColor);
      this.doc.rect(MARGIN_X, this.y, 3, totalH, "F");
    }
    return { innerX: MARGIN_X + 12, innerW: CONTENT_W - 24, startY: this.y + 10 };
  }

  private cardClose(totalH: number) {
    this.y += totalH + 6;
    this.setBody();
  }

  private wrapText(text: string, w: number, fontSize: number, font: "helvetica" | "courier" = "helvetica", style: "normal" | "bold" | "italic" = "normal"): { lines: string[]; lineH: number } {
    this.doc.setFont(font, style);
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(stripMd(text), w) as string[];
    return { lines, lineH: fontSize + 2 };
  }

  private measureLines(text: string, w: number, fontSize: number, font: "helvetica" | "courier" = "helvetica", style: "normal" | "bold" | "italic" = "normal"): number {
    this.doc.setFont(font, style);
    this.doc.setFontSize(fontSize);
    return (this.doc.splitTextToSize(stripMd(text), w) as string[]).length;
  }

  drawUserStoriesTable(stories: Array<any>) {
    this.drawHeading(`${stories.length} user stories`, 3);
    const padX = 12;
    const innerW = CONTENT_W - padX * 2;
    for (const s of stories) {
      const prio = typeof s.prioridade === "number" ? s.prioridade : undefined;
      const prioColor = prio && prio <= 2 ? "#C2410C" : prio === 3 ? PRIMARY : "#475569";
      // Measure
      const storyLine = `Como ${s.persona || "?"}, quero ${s.acao || "?"}, para ${s.valor || "?"}`;
      const storyLines = this.measureLines(storyLine, innerW, 10.5);
      const hasAcc = Array.isArray(s.aceitacao) && s.aceitacao.length > 0;
      const accLines = hasAcc ? s.aceitacao.reduce((acc: number, a: any) => acc + this.measureLines(String(a), innerW - 12, 9.5), 0) : 0;
      const totalH = 10 + 12 + storyLines * 12.5 + (hasAcc ? 4 + 10 + accLines * 11.5 : 0) + 10;
      const { innerX, innerW: iW, startY } = this.cardOpen(totalH, prioColor);
      let yy = startY;
      // Header row: id + epico + badges right
      this.doc.setFont("courier", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(MUTED);
      this.doc.text(String(s.id || ""), innerX, yy);
      let rx = innerX + iW;
      if (s.esforco) {
        const bw = this.doc.getTextWidth(s.esforco) + 8;
        rx -= bw;
        this.drawBadge(s.esforco, rx, yy, "#475569");
        rx -= 4;
      }
      if (prio) {
        const t = `P${prio}`;
        const bw = this.doc.getTextWidth(t) + 8;
        rx -= bw;
        this.drawBadge(t, rx, yy, prioColor);
        rx -= 4;
      }
      if (s.epico) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(MUTED);
        const epicoText = String(s.epico).toUpperCase();
        const ew = this.doc.getTextWidth(epicoText);
        rx -= ew;
        this.doc.text(epicoText, rx, yy);
      }
      yy += 12;
      const { lines, lineH } = this.wrapText(storyLine, iW, 10.5);
      this.doc.setTextColor(FG);
      for (const ln of lines) { this.doc.text(ln, innerX, yy); yy += lineH; }
      if (hasAcc) {
        yy += 4;
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(8);
        this.doc.setTextColor(MUTED);
        this.doc.text("CRITÉRIOS DE ACEITAÇÃO", innerX, yy);
        yy += 10;
        for (const a of s.aceitacao) {
          const { lines: al, lineH: alh } = this.wrapText(String(a), iW - 12, 9.5);
          this.doc.setFont("helvetica", "normal");
          this.doc.setFontSize(9.5);
          this.doc.setTextColor(PRIMARY);
          this.doc.text("▸", innerX, yy);
          this.doc.setTextColor(FG);
          for (let k = 0; k < al.length; k++) { this.doc.text(al[k], innerX + 10, yy); yy += alh; }
        }
      }
      this.cardClose(totalH);
    }
  }

  drawCasosTesteTable(casos: Array<any>, distribuicaoAlvo?: string) {
    this.drawHeading(`${casos.length} casos de teste`, 3);
    const padX = 12;
    const innerW = CONTENT_W - padX * 2;
    for (const c of casos) {
      const prio = String(c.prioridade || "P2");
      const prioColor = prio === "P0" ? "#B91C1C" : prio === "P1" ? "#B45309" : "#1D4ED8";
      const titulo = String(c.titulo || "");
      const tituloLines = this.measureLines(titulo, innerW, 11, "helvetica", "bold");
      const hasPre = !!c.preconds;
      const preLines = hasPre ? this.measureLines(String(c.preconds), innerW, 9.5) : 0;
      const hasSteps = Array.isArray(c.steps) && c.steps.length > 0;
      const stepLines = hasSteps ? c.steps.reduce((acc: number, st: any) => acc + this.measureLines(String(st), innerW - 16, 9.5), 0) : 0;
      const hasEsp = !!c.esperado;
      const espLines = hasEsp ? this.measureLines(String(c.esperado), innerW, 9.5) : 0;
      const totalH = 10 + 12 + tituloLines * 13
        + (hasPre ? 4 + 10 + preLines * 11.5 : 0)
        + (hasSteps ? 4 + 10 + stepLines * 11.5 : 0)
        + (hasEsp ? 4 + 10 + espLines * 11.5 : 0)
        + 10;
      const { innerX, innerW: iW, startY } = this.cardOpen(totalH, prioColor);
      let yy = startY;
      this.doc.setFont("courier", "normal");
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(MUTED);
      this.doc.text(String(c.id || ""), innerX, yy);
      const bw = this.doc.getTextWidth(prio) + 8;
      this.drawBadge(prio, innerX + iW - bw, yy, prioColor);
      if (c.tipo) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(MUTED);
        const tipoText = String(c.tipo).toUpperCase();
        const tw = this.doc.getTextWidth(tipoText);
        this.doc.text(tipoText, innerX + iW - bw - 6 - tw, yy);
      }
      yy += 12;
      const { lines: tl, lineH: tlh } = this.wrapText(titulo, iW, 11, "helvetica", "bold");
      this.doc.setTextColor(FG);
      for (const ln of tl) { this.doc.text(ln, innerX, yy); yy += tlh; }
      if (hasPre) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("PRÉ-CONDIÇÕES", innerX, yy); yy += 10;
        const { lines: pl, lineH: plh } = this.wrapText(String(c.preconds), iW, 9.5);
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(9.5); this.doc.setTextColor(FG);
        for (const ln of pl) { this.doc.text(ln, innerX, yy); yy += plh; }
      }
      if (hasSteps) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("PASSOS", innerX, yy); yy += 10;
        let n = 1;
        for (const st of c.steps) {
          const { lines: sl, lineH: slh } = this.wrapText(String(st), iW - 16, 9.5);
          this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(9.5); this.doc.setTextColor(PRIMARY);
          this.doc.text(`${n}.`, innerX, yy);
          this.doc.setFont("helvetica", "normal"); this.doc.setTextColor(FG);
          for (let k = 0; k < sl.length; k++) { this.doc.text(sl[k], innerX + 14, yy); yy += slh; }
          n++;
        }
      }
      if (hasEsp) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("RESULTADO ESPERADO", innerX, yy); yy += 10;
        const { lines: el, lineH: elh } = this.wrapText(String(c.esperado), iW, 9.5);
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(9.5); this.doc.setTextColor(FG);
        for (const ln of el) { this.doc.text(ln, innerX, yy); yy += elh; }
      }
      this.cardClose(totalH);
    }
    if (distribuicaoAlvo) {
      const { lines: dl, lineH: dlh } = this.wrapText(distribuicaoAlvo, CONTENT_W, 9, "helvetica", "italic");
      this.doc.setTextColor(MUTED);
      for (const ln of dl) {
        this.ensure(dlh);
        this.doc.text(ln, MARGIN_X, this.y);
        this.y += dlh;
      }
      this.setBody();
    }
  }

  drawMilestonesTable(milestones: Array<any>, duracaoTotal?: string, marcoMvp?: string | number) {
    const header = `${milestones.length} marcos${duracaoTotal ? ` · ${duracaoTotal}` : ""}${marcoMvp ? ` · MVP no marco ${marcoMvp}` : ""}`;
    this.drawHeading(header, 3);
    const padX = 12;
    const innerW = CONTENT_W - padX * 2;
    for (const m of milestones) {
      const risk = String(m.risco || "").toLowerCase();
      const riskColor = risk === "alto" ? "#B91C1C" : risk === "medio" ? "#B45309" : risk === "baixo" ? PRIMARY : "#6B7383";
      const isMvp = String(marcoMvp) === String(m.numero);
      const marcoLabel = `MARCO ${m.numero}`;
      this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(11);
      const mw = this.doc.getTextWidth(marcoLabel);
      const nameText = ` — ${String(m.nome || "")}`;
      // Compute dynamic right-reserved width: risk badge + MVP badge + duracao
      this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8.5);
      let rightReserve = 0;
      if (m.risco) rightReserve += this.doc.getTextWidth(String(m.risco).toUpperCase()) + 8 + 4;
      if (isMvp) rightReserve += this.doc.getTextWidth("MVP") + 8 + 4;
      if (m.duracao) {
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(8.5);
        rightReserve += this.doc.getTextWidth(String(m.duracao)) + 8;
      }
      const nameLines = this.measureLines(nameText, innerW - mw - rightReserve - 8, 11, "helvetica", "bold");
      const hasFeat = Array.isArray(m.features) && m.features.length > 0;
      const featLines = hasFeat ? m.features.reduce((acc: number, f: any) => acc + this.measureLines(String(f), innerW - 12, 9.5), 0) : 0;
      const hasCrit = !!m.criterio_aceitacao;
      const critLines = hasCrit ? this.measureLines(String(m.criterio_aceitacao), innerW, 9.5) : 0;
      const hasDemo = !!m.demo;
      const demoLines = hasDemo ? this.measureLines(String(m.demo), innerW, 9.5) : 0;
      const hasDeps = Array.isArray(m.dependencias) && m.dependencias.length > 0;
      const totalH = 10 + nameLines * 13
        + (hasFeat ? 4 + 10 + featLines * 11.5 : 0)
        + (hasCrit ? 4 + 10 + critLines * 11.5 : 0)
        + (hasDemo ? 4 + 10 + demoLines * 11.5 : 0)
        + (hasDeps ? 4 + 10 : 0)
        + 10;
      const { innerX, innerW: iW, startY } = this.cardOpen(totalH, isMvp ? ACCENT : PRIMARY);
      let yy = startY;
      this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(11); this.doc.setTextColor(PRIMARY);
      this.doc.text(marcoLabel, innerX, yy);
      const { lines: nl, lineH: nlh } = this.wrapText(nameText, iW - mw - rightReserve - 8, 11, "helvetica", "bold");
      this.doc.setTextColor(FG);
      this.doc.text(nl[0] || "", innerX + mw, yy);
      let rx = innerX + iW;
      if (m.risco) {
        const t = String(m.risco).toUpperCase();
        const bw = this.doc.getTextWidth(t) + 8;
        rx -= bw;
        this.drawBadge(t, rx, yy, riskColor);
        rx -= 4;
      }
      if (isMvp) {
        const t = "MVP";
        const bw = this.doc.getTextWidth(t) + 8;
        rx -= bw;
        this.drawBadge(t, rx, yy, ACCENT);
        rx -= 4;
      }
      if (m.duracao) {
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(8.5); this.doc.setTextColor(MUTED);
        const dText = String(m.duracao);
        const dw = this.doc.getTextWidth(dText);
        rx -= dw;
        this.doc.text(dText, rx, yy);
      }
      yy += nlh;
      for (let k = 1; k < nl.length; k++) {
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(11); this.doc.setTextColor(FG);
        this.doc.text(nl[k], innerX, yy);
        yy += nlh;
      }
      if (hasFeat) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("FEATURES", innerX, yy); yy += 10;
        for (const f of m.features) {
          const { lines: fl, lineH: flh } = this.wrapText(String(f), iW - 12, 9.5);
          this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(9.5); this.doc.setTextColor(PRIMARY);
          this.doc.text("•", innerX, yy);
          this.doc.setTextColor(FG);
          for (let k = 0; k < fl.length; k++) { this.doc.text(fl[k], innerX + 10, yy); yy += flh; }
        }
      }
      if (hasCrit) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("CRITÉRIO DE ACEITAÇÃO", innerX, yy); yy += 10;
        const { lines: cl, lineH: clh } = this.wrapText(String(m.criterio_aceitacao), iW, 9.5);
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(9.5); this.doc.setTextColor(FG);
        for (const ln of cl) { this.doc.text(ln, innerX, yy); yy += clh; }
      }
      if (hasDemo) {
        yy += 4;
        this.doc.setFont("helvetica", "bold"); this.doc.setFontSize(8); this.doc.setTextColor(MUTED);
        this.doc.text("DEMO", innerX, yy); yy += 10;
        const { lines: dl, lineH: dlh } = this.wrapText(String(m.demo), iW, 9.5);
        this.doc.setFont("helvetica", "italic"); this.doc.setFontSize(9.5); this.doc.setTextColor(FG);
        for (const ln of dl) { this.doc.text(ln, innerX, yy); yy += dlh; }
      }
      if (hasDeps) {
        yy += 4;
        this.doc.setFont("helvetica", "normal"); this.doc.setFontSize(8.5); this.doc.setTextColor(MUTED);
        this.doc.text(`Depende de: ${m.dependencias.join(", ")}`, innerX, yy);
        yy += 10;
      }
      this.cardClose(totalH);
    }
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
      const fence = ln.match(/^```(\w+)?\s*$/);
      if (fence) {
        const lang = (fence[1] || "").toLowerCase();
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        if (buf.length) {
          if (lang === "json" && this.tryDrawStructured(buf.join("\n"))) {
            // rendered as structured table
          } else {
            this.drawCode(buf);
          }
        }
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

  drawCover(title: string, subtitle: string, meta: Array<{ label: string; value: string }>, opts?: { completedPhases?: number; totalPhases?: number }) {
    const d = this.doc;

    // Full-bleed primary band at top (140pt tall)
    d.setFillColor(PRIMARY);
    d.rect(0, 0, PAGE_W, 140, "F");
    // Accent stripe
    d.setFillColor(ACCENT);
    d.rect(0, 140, PAGE_W, 4, "F");

    // Brand mark on band
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor("#FFFFFF");
    d.text("FOUNDERSFLOW", MARGIN_X, 50);
    d.setFont("helvetica", "normal");
    d.setFontSize(9);
    d.setTextColor("#EEF1FB");
    d.text("Documentação completa de produto", MARGIN_X, 66);

    // Right side — date pill
    d.setFont("helvetica", "normal");
    d.setFontSize(9);
    d.setTextColor("#EEF1FB");
    d.text(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), PAGE_W - MARGIN_X, 50, { align: "right" });

    // Title block
    const cy = 220;
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(MUTED);
    d.text("PROJETO", MARGIN_X, cy - 32);
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
    yy += 28;
    d.setFont("helvetica", "normal");
    d.setFontSize(12);
    d.setTextColor(MUTED);
    const subLines = d.splitTextToSize(subtitle, CONTENT_W);
    for (const sl of subLines) {
      d.text(sl, MARGIN_X, yy);
      yy += 16;
    }
    yy += 30;

    // Phase progress dots
    if (opts?.totalPhases) {
      const total = opts.totalPhases;
      const done = Math.max(0, Math.min(total, opts.completedPhases ?? 0));
      d.setFont("helvetica", "bold");
      d.setFontSize(9);
      d.setTextColor(MUTED);
      d.text("PROGRESSO DAS FASES", MARGIN_X, yy);
      yy += 14;
      const dotR = 10;
      const gap = 14;
      const totalW = total * (dotR * 2) + (total - 1) * gap;
      let dx = MARGIN_X;
      for (let i = 0; i < total; i++) {
        const cx = dx + dotR;
        if (i < done) {
          d.setFillColor(PRIMARY);
          d.circle(cx, yy + dotR, dotR, "F");
          d.setTextColor("#FFFFFF");
        } else {
          d.setFillColor("#F3F4F8");
          d.circle(cx, yy + dotR, dotR, "F");
          d.setDrawColor(RULE);
          d.setLineWidth(0.8);
          d.circle(cx, yy + dotR, dotR, "S");
          d.setTextColor(MUTED);
        }
        d.setFont("helvetica", "bold");
        d.setFontSize(9);
        d.text(String(i + 1), cx, yy + dotR + 3, { align: "center" });
        dx += dotR * 2 + gap;
      }
      // Label to the right of dots
      d.setFont("helvetica", "normal");
      d.setFontSize(10);
      d.setTextColor(FG);
      d.text(`${done} de ${total} concluídas`, dx + 8, yy + dotR + 3);
      void totalW;
      yy += dotR * 2 + 24;
    }

    // Meta block
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

    // Bottom CTA strip
    const stripY = PAGE_H - 90;
    d.setFillColor("#EEF1FB");
    d.rect(0, stripY, PAGE_W, 90, "F");
    d.setFont("helvetica", "bold");
    d.setFontSize(13);
    d.setTextColor(PRIMARY);
    d.text("Criado com FoundersFlow", MARGIN_X, stripY + 32);
    d.setFont("helvetica", "normal");
    d.setFontSize(10);
    d.setTextColor(FG);
    d.text("A plataforma de IA que leva produtos da ideia ao lançamento em 7 fases.", MARGIN_X, stripY + 52);
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(ACCENT);
    d.text("foundersflow.com.br ›", PAGE_W - MARGIN_X, stripY + 52, { align: "right" });

    this.doc.addPage();
    this.pageNum += 1;
    this.y = MARGIN_TOP;
    this.drawWatermark();
    this.drawHeaderFooter();
  }

  drawBackCover(opts: { projectName: string; shareUrl?: string | null }) {
    const d = this.doc;
    // Start fresh page
    d.addPage();
    this.pageNum += 1;
    this.y = MARGIN_TOP;
    // Suppress regular header/footer — full-bleed brand page
    // Full primary background
    d.setFillColor(PRIMARY);
    d.rect(0, 0, PAGE_W, PAGE_H, "F");
    // Accent corner stripe
    d.setFillColor(ACCENT);
    d.rect(0, 0, 6, PAGE_H, "F");

    // Mark
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor("#EEF1FB");
    d.text("FOUNDERSFLOW", MARGIN_X, 60);

    // Big headline
    let yy = PAGE_H * 0.38;
    d.setFont("helvetica", "bold");
    d.setFontSize(38);
    d.setTextColor("#FFFFFF");
    const head1 = d.splitTextToSize("Quer levar o seu produto", CONTENT_W);
    for (const ln of head1) { d.text(ln, MARGIN_X, yy); yy += 42; }
    d.setTextColor(ACCENT);
    const head2 = d.splitTextToSize("da ideia ao lançamento?", CONTENT_W);
    for (const ln of head2) { d.text(ln, MARGIN_X, yy); yy += 42; }

    // Accent rule
    d.setDrawColor(ACCENT);
    d.setLineWidth(4);
    d.line(MARGIN_X, yy + 6, MARGIN_X + 80, yy + 6);
    yy += 36;

    // Body
    d.setFont("helvetica", "normal");
    d.setFontSize(13);
    d.setTextColor("#EEF1FB");
    const body = [
      "Este documento foi gerado em minutos pela FoundersFlow:",
      "7 fases sequenciais com IA — da validação ao deploy validado.",
    ];
    for (const ln of body) { d.text(ln, MARGIN_X, yy); yy += 22; }
    yy += 16;

    // Feature bullets
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor("#FFFFFF");
    const bullets = [
      "Lean Canvas, PRD, RBAC, Threat Model — tudo pronto",
      "Compliance LGPD desde o dia 1",
      "Validação com entrevistas reais, não com achismo",
    ];
    for (const b of bullets) {
      d.setTextColor(ACCENT);
      d.text("›", MARGIN_X, yy);
      d.setTextColor("#FFFFFF");
      d.text(b, MARGIN_X + 16, yy);
      yy += 20;
    }

    // CTA box at bottom
    const ctaY = PAGE_H - 160;
    d.setFillColor(ACCENT);
    d.rect(MARGIN_X, ctaY, CONTENT_W, 70, "F");
    d.setFont("helvetica", "bold");
    d.setFontSize(18);
    d.setTextColor("#FFFFFF");
    d.text("Comece grátis em foundersflow.com.br", PAGE_W / 2, ctaY + 32, { align: "center" });
    d.setFont("helvetica", "normal");
    d.setFontSize(10);
    d.text("Sem cartão · 3 execuções de IA por dia no plano Explorar", PAGE_W / 2, ctaY + 52, { align: "center" });

    // Share link reference (if exists)
    if (opts.shareUrl) {
      d.setFont("helvetica", "normal");
      d.setFontSize(9);
      d.setTextColor("#EEF1FB");
      d.text("Versão pública deste plano:", MARGIN_X, PAGE_H - 60);
      d.setFont("helvetica", "bold");
      d.setTextColor("#FFFFFF");
      const url = opts.shareUrl.length > 80 ? opts.shareUrl.slice(0, 77) + "..." : opts.shareUrl;
      d.text(url, MARGIN_X, PAGE_H - 46);
    } else {
      d.setFont("helvetica", "normal");
      d.setFontSize(9);
      d.setTextColor("#EEF1FB");
      d.text(`Projeto: ${opts.projectName}`, MARGIN_X, PAGE_H - 46);
    }
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
  shareUrl?: string | null;
  phases: Array<{
    phaseNumber: number;
    name: string;
    status: string;
    artifacts: Array<{ artifactKey: string; label: string; content: string }>;
  }>;
}) {
  const completed = opts.phases.filter((p) => p.status === "completed").length;
  const total = opts.phases.length || 7;
  const r = new PdfRenderer(opts.projectName, opts.projectName);
  r.drawCover(
    opts.projectName,
    "Documentação completa das 7 fases — da validação ao lançamento.",
    [
      { label: "Fases concluídas", value: `${completed} de ${total}` },
      { label: "Entregáveis incluídos", value: String(opts.phases.reduce((acc, p) => acc + p.artifacts.filter((a) => a.content?.trim()).length, 0)) },
      { label: "Gerado por", value: "FoundersFlow · foundersflow.com.br" },
    ],
    { completedPhases: completed, totalPhases: total },
  );

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

  // Viral back cover — always present
  r.drawBackCover({ projectName: opts.projectName, shareUrl: opts.shareUrl ?? null });
  r.save(`foundersflow-${safeFilename(opts.projectName)}-${todayISO()}.pdf`);
}
