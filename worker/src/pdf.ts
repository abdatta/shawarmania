import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  decodeBase64,
  LILITA_TTF_BASE64,
  LOGO_PNG_BASE64,
  NUNITO_EXT_TTF_BASE64,
  NUNITO_TTF_BASE64,
} from "./assets.generated";
import { receiptContent, type ReceiptContent } from "./content";
import type { Receipt } from "./receipt";

/**
 * The receipt as a document, shaped like a receipt.
 *
 * **80 mm wide, and as tall as its own contents** — a receipt roll, not a sheet
 * of paper. An earlier draft was A4, reasoning that somebody might file it or
 * forward it to an accountant. The owner looked at one and overruled it
 * [owner, 2026-09-03]: a two-line bill on A4 is mostly empty space, it does not
 * read as a receipt, and 80 mm is the width every thermal roll printer takes —
 * so if `bill-thermal-printing` is ever built, this document is already the
 * right shape for it rather than something to redo. Height is computed from the
 * content, so a ten-line bill is a longer roll and a one-line bill a short one.
 *
 * Drawn directly with `pdf-lib` — a receipt is a logo and a table, and a
 * headless browser to render one would be a Chromium a Worker cannot run.
 *
 * **Built on demand and never stored.** Not only cheaper: a stored file cannot
 * know its bill was voided an hour later or its tender corrected, so generating
 * it at the moment it is asked for is the only shape that can be correct.
 *
 * **It decides nothing a reader can read.** Every label, subtext and amount comes
 * from `content.ts`, which the HTML page reads too, so the two cannot word a row
 * differently or carry a row the other lacks — the drift a two-renderer design
 * invites. What lives here is presentation: page size, typography, spacing and
 * the font fallback below. No arithmetic, and no second source of wording.
 *
 * **No name, no phone number, and nothing in the metadata either.** The document
 * information dictionary is set explicitly rather than left to defaults, because
 * a PDF that says nothing on the page and names somebody in its `Author` field
 * has leaked all the same.
 */

// 80 mm at 72 dpi. The printable area of an 80 mm roll is about 72 mm, so the
// margins keep every mark inside it.
const MM = 72 / 25.4;
const PAGE_WIDTH = 80 * MM;
const MARGIN = 5 * MM;
const CONTENT = PAGE_WIDTH - MARGIN * 2;

const CREAM = rgb(0.961, 0.894, 0.78);
const CREAM_DIM = rgb(0.788, 0.718, 0.584);
const CANVAS = rgb(0.078, 0.063, 0.043);
const HAIRLINE = rgb(0.28, 0.25, 0.2);
const GOLD = rgb(1, 0.773, 0.239);
const DANGER = rgb(0.988, 0.647, 0.647);

/**
 * Three faces, and the third exists for a single character.
 *
 * `@fontsource` splits its fonts by unicode range, and **no single Nunito Sans
 * file contains both the digits and the rupee sign**: `latin` has the digits,
 * `latin-ext` has `₹`. A browser stitches the ranges together through two
 * `@font-face` rules; a PDF must embed real fonts and pick one per glyph. So
 * both are embedded and {@link splitRuns} routes each character to a face that
 * can draw it — a two-font fallback, which is what a text engine does.
 *
 * Found by looking at the output: the first draft embedded `latin` only and drew
 * every `₹` as a missing-glyph box; the naive fix of swapping to `latin-ext`
 * turned every *digit* into one instead.
 */
interface Faces {
  display: PDFFont;
  text: PDFFont;
  /** Carries `₹` and the rest of Latin Extended. Reached only where `text` cannot. */
  ext: PDFFont;
}

/**
 * The filename a person sees in Downloads. Never `download.pdf`.
 *
 * The brand name is dropped from the outlet's own name before it is prefixed
 * back on, because every outlet is called "Shawarmania Kalyani" or
 * "Shawarmania Kanchrapara" and the obvious template produces
 * `Shawarmania-Shawarmania-Kalyani-Bill-10.pdf`.
 */
export function pdfFilename(receipt: Receipt): string {
  const outlet = receipt.outlet.name
    .replace(/shawarmania/gi, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return `Shawarmania-${outlet || "Outlet"}-Bill-${receipt.bill_number}.pdf`;
}

// ---------------------------------------------------------------------------
// Text, with a fallback face.

interface Run {
  text: string;
  font: PDFFont;
}

/**
 * Can this face actually draw this character?
 *
 * `pdf-lib` exposes no coverage query, so this reaches through to the fontkit
 * font it embedded and asks whether the character lays out to a real glyph. A
 * glyph id of `0` is `.notdef` — the box. Cached per face, because a receipt
 * asks about the same few dozen characters over and over.
 */
const coverage = new WeakMap<PDFFont, Map<number, boolean>>();

function canDraw(font: PDFFont, character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  let seen = coverage.get(font);
  if (!seen) {
    seen = new Map<number, boolean>();
    coverage.set(font, seen);
  }
  const cached = seen.get(code);
  if (cached !== undefined) return cached;

  let able = false;
  try {
    const embedded = font as unknown as {
      embedder?: {
        font?: { layout?: (value: string) => { glyphs: { id: number }[] } };
      };
    };
    const layout = embedded.embedder?.font?.layout;
    if (layout) {
      able = layout
        .call(embedded.embedder!.font, character)
        .glyphs.every((glyph) => glyph.id !== 0);
    } else {
      // A standard font, which has no fontkit behind it. Encoding throws for a
      // character it cannot represent, so trying is the query.
      font.widthOfTextAtSize(character, 10);
      able = true;
    }
  } catch {
    able = false;
  }
  seen.set(code, able);
  return able;
}

function splitRuns(text: string, primary: PDFFont, fallback: PDFFont): Run[] {
  const out: Run[] = [];
  for (const character of text) {
    const font = canDraw(primary, character) ? primary : fallback;
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += character;
    else out.push({ text: character, font });
  }
  return out;
}

function widthOfRuns(
  text: string,
  size: number,
  primary: PDFFont,
  fallback: PDFFont,
): number {
  return splitRuns(text, primary, fallback).reduce(
    (total, run) => total + run.font.widthOfTextAtSize(run.text, size),
    0,
  );
}

function drawRuns(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
  primary: PDFFont,
  fallback: PDFFont,
): void {
  let cursor = x;
  for (const run of splitRuns(text, primary, fallback)) {
    page.drawText(run.text, { x: cursor, y, size, font: run.font, color });
    cursor += run.font.widthOfTextAtSize(run.text, size);
  }
}

function truncate(
  text: string,
  size: number,
  room: number,
  primary: PDFFont,
  fallback: PDFFont,
): string {
  if (widthOfRuns(text, size, primary, fallback) <= room) return text;
  let clipped = text;
  while (
    clipped.length > 1 &&
    widthOfRuns(`${clipped}…`, size, primary, fallback) > room
  ) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// The layout, measured before it is drawn.
//
// The page height is the content's height, so the document is built in two
// passes over one list of rows: measure them, create a page that tall, draw.

type Row =
  | { kind: "logo"; height: number }
  | {
      kind: "centre";
      text: string;
      size: number;
      display: boolean;
      dim: boolean;
    }
  | { kind: "rule" }
  | { kind: "gap"; height: number }
  | { kind: "banner"; text: string; sub: string | null }
  | { kind: "line"; name: string; sub: string; amount: string }
  | {
      kind: "figure";
      label: string;
      sub: string | null;
      amount: string;
      gold: boolean;
    }
  | { kind: "total"; label: string; amount: string };

const ROW_GAP = 2;

function rowHeight(row: Row): number {
  switch (row.kind) {
    case "logo":
      return row.height;
    case "centre":
      return row.size * 1.4;
    case "rule":
      return 7;
    case "gap":
      return row.height;
    case "banner":
      return row.sub ? 26 : 16;
    case "line":
      return 20;
    case "figure":
      return row.sub ? 19 : 12;
    case "total":
      return 24;
  }
}

/**
 * The content model, arranged for an 80 mm roll.
 *
 * Every string here comes from `content`; this decides only where it sits and
 * how much room it gets. `content.test.ts` asserts that the strings this
 * produces are exactly the strings the model holds — so a row cannot be dropped
 * from the PDF while surviving on the page, and neither can be invented here.
 */
function layout(content: ReceiptContent, logoHeight: number): Row[] {
  const rows: Row[] = [
    { kind: "gap", height: 6 },
    { kind: "logo", height: logoHeight },
    { kind: "gap", height: 6 },
    {
      kind: "centre",
      text: content.outletName,
      size: 13,
      display: true,
      dim: false,
    },
    {
      kind: "centre",
      text: content.when,
      size: 7.5,
      display: false,
      dim: true,
    },
    {
      kind: "centre",
      text: content.billLabel,
      size: 7.5,
      display: false,
      dim: true,
    },
    { kind: "rule" },
  ];

  if (content.cancelled) {
    rows.push({
      kind: "banner",
      text: content.cancelled.label.toUpperCase(),
      sub: content.cancelled.reason,
    });
    rows.push({ kind: "rule" });
  }

  for (const line of content.lines) {
    rows.push({
      kind: "line",
      name: line.label,
      sub: line.detail ?? "",
      amount: line.amount,
    });
  }

  rows.push({ kind: "rule" });

  if (content.subtotal) {
    rows.push({
      kind: "figure",
      label: content.subtotal.label,
      sub: content.subtotal.detail,
      amount: content.subtotal.amount,
      gold: false,
    });
  }

  for (const entry of content.adjustments) {
    rows.push({
      kind: "figure",
      label: entry.label,
      sub: entry.detail,
      amount: entry.amount,
      gold: entry.giveaway,
    });
  }

  // The same double-rule the page had: with no subtotal and no adjustments, the
  // rule after the lines and the rule before the total have nothing between
  // them, and two hairlines nine points apart is a mistake rather than a
  // flourish. One rule, when there is nothing to separate.
  if (content.subtotal || content.adjustments.length > 0) {
    rows.push({ kind: "rule" });
  }
  rows.push({
    kind: "total",
    label: content.total.label,
    amount: content.total.amount,
  });

  rows.push({ kind: "gap", height: 2 });
  rows.push({
    kind: "centre",
    text: content.tender,
    size: 8,
    display: false,
    dim: false,
  });

  rows.push({ kind: "gap", height: 10 });
  for (const note of content.notes) {
    rows.push({
      kind: "centre",
      text: note,
      size: 6.5,
      display: false,
      dim: true,
    });
  }
  rows.push({ kind: "gap", height: 8 });

  return rows;
}

/**
 * The kinds of row this layout will lay down, in order.
 *
 * Exported for one invariant worth keeping: **no two rules in a row.** A rule
 * separates things, so two with nothing between them is always a mistake -- and
 * it was one, on any bill with no subtotal and no adjustments, until somebody
 * looked at the page and asked why the line above Total was odd.
 */
export function pdfRowKinds(receipt: Receipt): Row["kind"][] {
  return layout(receiptContent(receipt), 0).map((row) => row.kind);
}

/**
 * Every string this layout will draw, in order.
 *
 * Exported so the agreement test can compare it against the content model
 * without rendering a PDF and reading its text layer back.
 */
export function pdfStrings(receipt: Receipt): string[] {
  // The logo's height does not affect which strings are drawn.
  return layout(receiptContent(receipt), 0).flatMap((row) => {
    switch (row.kind) {
      case "centre":
        return [row.text];
      case "banner":
        return row.sub ? [row.text, row.sub] : [row.text];
      case "line":
        return row.sub
          ? [row.name, row.sub, row.amount]
          : [row.name, row.amount];
      case "figure":
        return row.sub
          ? [row.label, row.sub, row.amount]
          : [row.label, row.amount];
      case "total":
        return [row.label, row.amount];
      default:
        return [];
    }
  });
}

export async function renderReceiptPdf(receipt: Receipt): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  /*
   * Not subsetted, deliberately.
   *
   * Subsetting a *variable* font through `pdf-lib` produced a PDF whose every
   * Latin letter rendered as a missing-glyph box — structurally valid, entirely
   * unreadable, and no test would have said so. Whole faces cost about 130 KB,
   * which is the right trade against a receipt nobody can read.
   */
  const faces: Faces = {
    display: await doc.embedFont(decodeBase64(LILITA_TTF_BASE64)),
    text: await doc.embedFont(decodeBase64(NUNITO_TTF_BASE64)),
    ext: await doc.embedFont(decodeBase64(NUNITO_EXT_TTF_BASE64)),
  };
  const logo = await doc.embedPng(decodeBase64(LOGO_PNG_BASE64));

  doc.setTitle(`Shawarmania receipt · Bill ${receipt.bill_number}`);
  doc.setAuthor("Shawarmania");
  doc.setSubject("Customer receipt");
  doc.setProducer("Shawarmania");
  doc.setCreator("Shawarmania");
  doc.setKeywords([]);

  const logoWidth = 32 * MM;
  const logoHeight = (logo.height / logo.width) * logoWidth;

  const rows = layout(receiptContent(receipt), logoHeight);
  const height = rows.reduce(
    (total, row) => total + rowHeight(row) + ROW_GAP,
    0,
  );

  const page = doc.addPage([PAGE_WIDTH, height]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height, color: CANVAS });

  let y = height;

  for (const row of rows) {
    const h = rowHeight(row);
    y -= h;

    switch (row.kind) {
      case "gap":
        break;

      case "logo":
        page.drawImage(logo, {
          x: MARGIN + (CONTENT - logoWidth) / 2,
          y,
          width: logoWidth,
          height: logoHeight,
        });
        break;

      case "rule":
        page.drawRectangle({
          x: MARGIN,
          y: y + h / 2,
          width: CONTENT,
          height: 0.6,
          color: HAIRLINE,
        });
        break;

      case "centre": {
        const font = row.display ? faces.display : faces.text;
        const width = widthOfRuns(row.text, row.size, font, faces.ext);
        drawRuns(
          page,
          row.text,
          MARGIN + (CONTENT - width) / 2,
          y + row.size * 0.3,
          row.size,
          row.dim ? CREAM_DIM : CREAM,
          font,
          faces.ext,
        );
        break;
      }

      case "banner": {
        const width = widthOfRuns(row.text, 10, faces.text, faces.ext);
        drawRuns(
          page,
          row.text,
          MARGIN + (CONTENT - width) / 2,
          y + h - 11,
          10,
          DANGER,
          faces.text,
          faces.ext,
        );
        if (row.sub) {
          const subWidth = widthOfRuns(row.sub, 7, faces.text, faces.ext);
          drawRuns(
            page,
            row.sub,
            MARGIN + (CONTENT - subWidth) / 2,
            y + 2,
            7,
            CREAM_DIM,
            faces.text,
            faces.ext,
          );
        }
        break;
      }

      case "line": {
        const amountWidth = widthOfRuns(row.amount, 8.5, faces.text, faces.ext);
        // Truncated rather than wrapped: an 80 mm roll has no room for a second
        // line per item, and an ellipsis is honest about it.
        const name = truncate(
          row.name,
          8.5,
          CONTENT - amountWidth - 8,
          faces.text,
          faces.ext,
        );
        drawRuns(
          page,
          name,
          MARGIN,
          y + h - 10,
          8.5,
          CREAM,
          faces.text,
          faces.ext,
        );
        drawRuns(
          page,
          row.amount,
          MARGIN + CONTENT - amountWidth,
          y + h - 10,
          8.5,
          CREAM,
          faces.text,
          faces.ext,
        );
        drawRuns(
          page,
          row.sub,
          MARGIN,
          y + 1,
          6.5,
          CREAM_DIM,
          faces.text,
          faces.ext,
        );
        break;
      }

      case "figure": {
        const amountWidth = widthOfRuns(row.amount, 8, faces.text, faces.ext);
        const top = row.sub ? y + h - 9 : y + 2;
        drawRuns(page, row.label, MARGIN, top, 8, CREAM, faces.text, faces.ext);
        drawRuns(
          page,
          row.amount,
          MARGIN + CONTENT - amountWidth,
          top,
          8,
          row.gold ? GOLD : CREAM,
          faces.text,
          faces.ext,
        );
        if (row.sub)
          drawRuns(
            page,
            row.sub,
            MARGIN,
            y + 1,
            6,
            CREAM_DIM,
            faces.text,
            faces.ext,
          );
        break;
      }

      case "total": {
        const amountWidth = widthOfRuns(row.amount, 14, faces.text, faces.ext);
        page.drawText(row.label, {
          x: MARGIN,
          y: y + 6,
          size: 12,
          font: faces.display,
          color: CREAM,
        });
        drawRuns(
          page,
          row.amount,
          MARGIN + CONTENT - amountWidth,
          y + 6,
          14,
          CREAM,
          faces.text,
          faces.ext,
        );
        break;
      }
    }

    y -= ROW_GAP;
  }

  return doc.save();
}
