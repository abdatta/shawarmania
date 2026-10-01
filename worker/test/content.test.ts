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
    name: "a gold member's bill with free packaging, points used, earned and a balance",
    receipt: {
      ...bill({
      totals: {
        subtotal_paise: 29300,
        discount_paise: 3300,
        tax_paise: 0,
        rounding_paise: 0,
        total_paise: 26000,
      },
      lines: [
        {
          item_name: "Classic Chicken Shawarma",
          quantity: 2,
          unit_price_paise: 13900,
          line_total_paise: 27800,
        },
        {
          item_name: "Packaging",
          quantity: 3,
          unit_price_paise: 500,
          line_total_paise: 1500,
        },
      ],
      discount_rows: [
        {
          source: "packaging",
          basis: "percent",
          value_bp: 10000,
          value_paise: null,
          categories: [],
          amount_paise: 1500,
        },
        {
          source: "points",
          basis: "amount",
          value_bp: null,
          value_paise: 1800,
          categories: [],
          amount_paise: 1800,
        },
      ],
      payments: [{ method: "upi", amount_paise: 26000 }],
      points: { used: 0, earned: 6, balance: 42 },
    }),
      points: { used: 18, earned: 6, balance: 42 },
    },
  },

  {
    name: "a bill that only earned points",
    receipt: bill({ points: { used: 0, earned: 2, balance: 2 } }),
  },

  {
    name: "a voided bill keeps the points it was sold with",
    receipt: bill({
      status: "void",
      void_reason: "Wrong order",
      points: { used: 0, earned: 2, balance: 2 },
    }),
  },

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

  // What the receipt says of its customer and how the bill was served (ops #58).
  {
    name: "a bill whose customer gave their number",
    receipt: bill({ phone_last4: "0042", gold_at_outlet: false }),
  },

  {
    name: "a gold member's bill",
    receipt: bill({
      outlet: { name: "Kalyani Cafe" },
      phone_last4: "5801",
      gold_at_outlet: true,
    }),
  },

  {
    name: "a dine-in bill at a table",
    receipt: bill({ service_type: "dine_in" }),
  },

  {
    name: "a dine-in bill with no table",
    receipt: bill({ service_type: "dine_in" }),
  },

  {
    name: "a takeaway bill",
    receipt: bill({ service_type: "takeaway" }),
  },

  {
    name: "a cancelled dine-in bill for a gold member, with points",
    receipt: bill({
      outlet: { name: "Kalyani Cafe" },
      status: "void",
      void_reason: "Wrong table",
      phone_last4: "5801",
      gold_at_outlet: true,
      service_type: "dine_in",
      points: { used: 0, earned: 2, balance: 2 },
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

  it("names the points row by the points it used, and the waiver as free packaging", () => {
    const content = receiptContent({
      ...bill({
        totals: {
          subtotal_paise: 29300,
          discount_paise: 3300,
          tax_paise: 0,
          rounding_paise: 0,
          total_paise: 26000,
        },
        lines: [
          {
            item_name: "Classic Chicken Shawarma",
            quantity: 2,
            unit_price_paise: 13900,
            line_total_paise: 27800,
          },
          {
            item_name: "Packaging",
            quantity: 3,
            unit_price_paise: 500,
            line_total_paise: 1500,
          },
        ],
        discount_rows: [
          {
            source: "packaging",
            basis: "percent",
            value_bp: 10000,
            value_paise: null,
            categories: [],
            amount_paise: 1500,
          },
          {
            source: "points",
            basis: "amount",
            value_bp: null,
            value_paise: 1800,
            categories: [],
            amount_paise: 1800,
          },
        ],
        payments: [{ method: "upi", amount_paise: 26000 }],
        points: { used: 0, earned: 6, balance: 42 },
      }),
      points: { used: 18, earned: 6, balance: 42 },
    });
    expect(content.adjustments.map((row) => [row.label, row.detail, row.amount])).toEqual([
      ["Free packaging", "Gold member", "−₹15"],
      ["Points (18)", "From your points", "−₹18"],
    ]);
    // What the bill used is its discount row, *Points (18)*, and nowhere else: a
    // second *Points used 18* beneath the payment read as eighteen more points
    // spent [owner, 2026-09-30].
    // One line: what it earned at the left, the balance at the right
    // [owner, 2026-09-30].
    expect(content.points).toEqual({ earned: "+6 pts earned", balance: "Balance: 42 pts" });
  });

  it.each([
    [{ used: 0, earned: 1, balance: 1 }, { earned: "+1 pt earned", balance: "Balance: 1 pt" }],
    [{ used: 0, earned: 14, balance: 96 }, { earned: "+14 pts earned", balance: "Balance: 96 pts" }],
    // A bill paid wholly with points can earn nothing; it says only the balance
    // rather than "+0 pts earned".
    [{ used: 40, earned: 0, balance: 2 }, { earned: null, balance: "Balance: 2 pts" }],
    [{ used: 12, earned: 0, balance: 0 }, { earned: null, balance: "Balance: 0 pts" }],
  ])("words the points line: %o", (points, said) => {
    expect(receiptContent(bill({ points })).points).toEqual(said);
  });

  it.each([
    ["Kalyani Cafe", "Shawarmania · Kalyani Cafe"],
    ["Shawarmania Kalyani", "Shawarmania · Kalyani"],
    ["Shawarmania", "Shawarmania"],
  ])("signs the small print with the bill's own outlet: %s", (outlet, note) => {
    expect(receiptContent(bill({ outlet: { name: outlet } })).notes).toEqual([note]);
  });

  it("says nothing about points on a bill that had none", () => {
    expect(receiptContent(bill()).points).toBeNull();
    expect(receiptContent(bill({ points: null })).points).toBeNull();
  });

  it("omits a subtotal that would only restate the single line above it", () => {
    expect(receiptContent(bill()).subtotal).toBeNull();
  });
});

/*
 * What the receipt says of whose it is, and how it was served (ops #58,
 * `the-receipt-says-its-yours`). Four digits and a gold mark let the holder say
 * "yes, mine"; neither tells a stranger who that is. Never the name.
 */
describe("what the receipt says of its customer", () => {
  it("masks the number to its last four digits", () => {
    const content = receiptContent(bill({ phone_last4: "0042" }));
    expect(content.holder.phone).toBe("+91 ••••• •0042");
  });

  it("says gold at the bill's own outlet, in words the PDF can draw", () => {
    const content = receiptContent(
      bill({ outlet: { name: "Kalyani Cafe" }, phone_last4: "5801", gold_at_outlet: true }),
    );
    // The star is presentation: the page draws an emoji, the PDF a vector star,
    // because the PDF's faces carry no emoji. The words are the same in both.
    // The receipt names its outlet already; the mark says only *Gold*.
    expect(content.holder.gold).toBe("Gold");
  });

  it("says nothing of a customer the payload does not carry", () => {
    const content = receiptContent(bill());
    expect(content.holder).toEqual({ phone: null, gold: null });
    expect(content.service).toBeNull();
  });

  it("does not mark a customer gold who is not", () => {
    const content = receiptContent(bill({ phone_last4: "0042", gold_at_outlet: false }));
    expect(content.holder.gold).toBeNull();
  });

  it.each([
    [{ service_type: "dine_in" }, "Dine-in"],
    [{ service_type: "takeaway" }, "Takeaway"],
    [{ service_type: null }, null],
  ] as const)("words how the bill was served: %o", (served, said) => {
    expect(receiptContent(bill(served)).service).toBe(said);
  });

  it("puts whose it is and how it was served straight after the bill number", () => {
    const said = contentStrings(
      receiptContent(
        bill({
          outlet: { name: "Kalyani Cafe" },
          phone_last4: "5801",
          gold_at_outlet: true,
          service_type: "dine_in",
        }),
      ),
    );
    // Bill and date and time, then service, gold and the number, reading order
    // [owner, 2026-09-30].
    const at = said.indexOf("Bill 10");
    expect(said.slice(at, at + 5)).toEqual([
      "Bill 10",
      "03 Sep 2026 · 1:05 pm",
      "Dine-in",
      "Gold",
      "+91 ••••• •5801",
    ]);
  });

  it("dates the bill by its business date and its time of sale", () => {
    expect(receiptContent(bill()).when).toBe("03 Sep 2026 · 1:05 pm");
  });

  // A table is a label for the length of a meal, like the order number, and the
  // receipt shows neither [owner, 2026-09-30].
  it("never names a table, even if one reached it", () => {
    const content = receiptContent({
      ...bill({ service_type: "dine_in" }),
      ...({ table_number: 12 } as object),
    } as Receipt);
    expect(content.service).toBe("Dine-in");
    expect(contentStrings(content).join(" ")).not.toMatch(/table/i);
  });
});
