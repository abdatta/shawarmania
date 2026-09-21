import { describe, expect, it } from "vitest";

import { contentStrings, receiptContent } from "../src/content";
import { renderReceiptPage } from "../src/page";
import { pdfRowKinds, pdfStrings } from "../src/pdf";
import type { Receipt } from "../src/receipt";

/**
 * **The two renderers may not drift.**
 *
 * A receipt is rendered twice — an HTML page to look at, an 80 mm PDF to keep —
 * and neither can be produced from the other inside a Worker. Two renderers over
 * one design is the arrangement that rots: somebody relabels a row on the page,
 * the PDF keeps the old wording, and a customer holding both sees two different
 * receipts for one bill. Worse, a row gets dropped from one and nobody notices
 * for months.
 *
 * `content.ts` is the answer: it decides every label, subtext and amount, and
 * the renderers decide only how they look. This file is what holds them to it.
 * It asserts, over every shape of bill the system can produce, that
 *
 *   - the page renders **every** string the content model says, and
 *   - the PDF's layout emits **exactly** the strings the content model says —
 *     no more, no fewer, in the same order.
 *
 * The page is checked for containment rather than equality because it also
 * carries chrome the PDF has no equivalent for: a `<title>`, the preview card,
 * and the Download control that only makes sense in a browser. The PDF is
 * checked for equality because it has no chrome and therefore no excuse.
 */

type Shape = { name: string; receipt: Receipt };

function bill(overrides: Partial<Receipt> = {}): Receipt {
  return {
    outlet: { name: "Shawarmania Kalyani" },
    bill_number: 10,
    business_date: "2026-09-03",
    sold_at: "2026-09-03T07:35:00.000Z",
    status: "settled",
    void_reason: null,
    totals: {
      subtotal_paise: 9900,
      discount_paise: 0,
      tax_paise: 0,
      rounding_paise: 0,
      total_paise: 9900,
    },
    lines: [
      {
        item_name: "Cold Coffee",
        quantity: 1,
        unit_price_paise: 9900,
        line_total_paise: 9900,
      },
    ],
    discount_rows: [],
    payments: [{ method: "cash", amount_paise: 9900 }],
    ...overrides,
  };
}

/**
 * Every shape of bill the ops database can hand this Worker. If a case is
 * missing here, it is a case where the two renderers are free to disagree.
 */
const SHAPES: Shape[] = [
  { name: "a plain one-line bill", receipt: bill() },

  {
    name: "a bill with both kinds of discount, a round-up and a split tender",
    receipt: bill({
      totals: {
        subtotal_paise: 33700,
        discount_paise: 8215,
        tax_paise: 0,
        rounding_paise: 15,
        total_paise: 25500,
      },
      lines: [
        {
          item_name: "Stuffed Lebanese Chicken Shawarma",
          quantity: 1,
          unit_price_paise: 23800,
          line_total_paise: 23800,
        },
        {
          item_name: "Cold Coffee",
          quantity: 1,
          unit_price_paise: 9900,
          line_total_paise: 9900,
        },
      ],
      discount_rows: [
        {
          source: "menu",
          basis: "percent",
          value_bp: 1500,
          value_paise: null,
          categories: ["Shawarma"],
          amount_paise: 3570,
        },
        {
          source: "bill",
          basis: "amount",
          value_bp: null,
          value_paise: 4645,
          categories: [],
          amount_paise: 4645,
        },
      ],
      payments: [
        { method: "cash", amount_paise: 20000 },
        { method: "upi", amount_paise: 5500 },
      ],
    }),
  },

  {
    name: "a fully discounted meal, which is a ₹1 bill",
    receipt: bill({
      totals: {
        subtotal_paise: 13900,
        discount_paise: 13900,
        tax_paise: 0,
        rounding_paise: 100,
        total_paise: 100,
      },
      lines: [
        {
          item_name: "Classic Chicken Shawarma",
          quantity: 1,
          unit_price_paise: 13900,
          line_total_paise: 13900,
        },
      ],
      discount_rows: [
        {
          source: "menu",
          basis: "percent",
          value_bp: 10000,
          value_paise: null,
          categories: ["Shawarma"],
          amount_paise: 13900,
        },
      ],
      payments: [{ method: "cash", amount_paise: 100 }],
    }),
  },

  {
    name: "a cancelled bill",
    receipt: bill({ status: "void", void_reason: "Rung twice by mistake" }),
  },

  {
    name: "a cancelled bill with no reason recorded",
    receipt: bill({ status: "void", void_reason: null }),
  },

  {
    name: "a discount over several categories at once",
    receipt: bill({
      totals: {
        subtotal_paise: 33700,
        discount_paise: 3370,
        tax_paise: 0,
        rounding_paise: 70,
        total_paise: 30400,
      },
      lines: [
        {
          item_name: "Stuffed Lebanese Chicken Shawarma",
          quantity: 1,
          unit_price_paise: 23800,
          line_total_paise: 23800,
        },
        {
          item_name: "Cold Coffee",
          quantity: 1,
          unit_price_paise: 9900,
          line_total_paise: 9900,
        },
      ],
      discount_rows: [
        {
          source: "menu",
          basis: "percent",
          value_bp: 1000,
          value_paise: null,
          categories: ["Shawarma", "Drinks"],
          amount_paise: 3370,
        },
      ],
    }),
  },

  {
    name: "a discount whose categories the bill did not record",
    receipt: bill({
      totals: {
        subtotal_paise: 9900,
        discount_paise: 990,
        tax_paise: 0,
        rounding_paise: 90,
        total_paise: 9000,
      },
      discount_rows: [
        {
          source: "menu",
          basis: "percent",
          value_bp: 1000,
          value_paise: null,
          categories: [],
          amount_paise: 990,
        },
      ],
    }),
  },

  {
    name: "a fractional percentage, which divides into no whole paisa",
    receipt: bill({
      totals: {
        subtotal_paise: 13900,
        discount_paise: 1043,
        tax_paise: 0,
        rounding_paise: 43,
        total_paise: 12900,
      },
      lines: [
        {
          item_name: "Classic Chicken Shawarma",
          quantity: 1,
          unit_price_paise: 13900,
          line_total_paise: 13900,
        },
      ],
      discount_rows: [
        {
          source: "menu",
          basis: "percent",
          value_bp: 750,
          value_paise: null,
          categories: ["Shawarma"],
          amount_paise: 1043,
        },
      ],
    }),
  },

  {
    name: "a quantity above one, so the per-unit price is not the line total",
    receipt: bill({
      totals: {
        subtotal_paise: 41700,
        discount_paise: 0,
        tax_paise: 0,
        rounding_paise: 0,
        total_paise: 41700,
      },
      lines: [
        {
          item_name: "Classic Chicken Shawarma",
          quantity: 3,
          unit_price_paise: 13900,
          line_total_paise: 41700,
        },
      ],
      payments: [{ method: "upi", amount_paise: 41700 }],
    }),
  },
];

describe.each(SHAPES.map((shape) => [shape.name, shape.receipt] as const))(
  "the page and the PDF say the same thing: %s",
  (_name, receipt) => {
    const content = receiptContent(receipt);
    const said = contentStrings(content);

    it("the content model says something at all", () => {
      expect(said.length).toBeGreaterThan(5);
      expect(said.every((value) => value.length > 0)).toBe(true);
    });

    it("the page renders every string the content model says", () => {
      const html = renderReceiptPage(receipt, "Ab3-_x9QzT");
      // `&` is the only character the receipt's own strings carry that HTML
      // escapes, and the footer note carries one.
      const rendered = html.replace(/&amp;/g, "&");
      const missing = said.filter((value) => !rendered.includes(value));
      expect(missing).toEqual([]);
    });

    /*
     * A rule separates things, so two with nothing between them is always a
     * mistake. It was one: on a bill with no subtotal and no adjustments, the
     * rule after the lines and the rule before the total had nothing between
     * them. The page had the same bug in CSS, where it read as an odd inset
     * line under a full-width one.
     */
    it("never draws two rules in a row", () => {
      const kinds = pdfRowKinds(receipt);
      const doubled = kinds.filter(
        (kind, i) => kind === "rule" && kinds[i + 1] === "rule",
      );
      expect(doubled).toEqual([]);
    });

    it("the PDF emits exactly the strings the content model says, in order", () => {
      // Equality, not containment. The PDF has no chrome, so a string in its
      // layout that the model does not hold is a string somebody wrote into a
      // renderer -- which is the drift this file exists to prevent.
      const drawn = pdfStrings(receipt);
      const expected = said.map((value) =>
        // The banner is the one deliberate difference, and it is presentational:
        // the page shouts `Cancelled` with CSS, the PDF has no CSS to shout with.
        value === content.cancelled?.label ? value.toUpperCase() : value,
      );
      expect(drawn).toEqual(expected);
    });
  },
);

describe("what the content model refuses to say", () => {
  it("names no customer, whatever the payload carries", () => {
    const said = contentStrings(
      receiptContent({
        ...bill(),
        ...({
          customer_name: "Placeholder Name",
          customer_phone: "+919000000042",
        } as object),
      } as Receipt),
    );
    expect(said.join(" ")).not.toContain("Placeholder");
    expect(said.join(" ")).not.toContain("9000000042");
  });

  it('never claims "All Items", because it cannot know the menu at sale time', () => {
    const said = contentStrings(
      receiptContent(
        bill({
          totals: {
            subtotal_paise: 9900,
            discount_paise: 990,
            tax_paise: 0,
            rounding_paise: 90,
            total_paise: 9000,
          },
          discount_rows: [
            {
              source: "menu",
              basis: "percent",
              value_bp: 1000,
              value_paise: null,
              categories: ["Shawarma", "Drinks", "Sides"],
              amount_paise: 990,
            },
          ],
        }),
      ),
    );
    expect(said.join(" ")).not.toMatch(/all items/i);
    expect(said.join(" ")).toContain("Shawarma, Drinks, Sides");
  });

  it("omits a subtotal that would only restate the single line above it", () => {
    expect(receiptContent(bill()).subtotal).toBeNull();
  });
});
