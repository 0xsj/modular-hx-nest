import { describe, expect, test } from "vitest";
import { failureFromResponse } from "./index";
import { FAILURE_KINDS } from "~/lib/kernel";

/**
 * Scope: H8's precedence clause only —
 *
 *   "Precedence, when a body carries both an unrecognised `kind` and its own
 *   `type`. The body's `type` wins, and the unrecognised kind is not kept."
 *
 * Not covered here (tested elsewhere, per the brief): the message fallback
 * chain (message/detail/title), status -> kind classification, requestId /
 * correlationId, and totality of the ten-member kind union in general.
 */

const knownKinds: readonly string[] = FAILURE_KINDS;

function makeResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: "status",
    headers: { "content-type": "application/json" },
  });
}

function makeRawResponse(rawJson: string, status: number): Response {
  return new Response(rawJson, {
    status,
    statusText: "status",
    headers: { "content-type": "application/json" },
  });
}

describe("property: the body's own `type` wins over an unrecognized `kind`, whatever else varies", () => {
  const statuses = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503];

  test.each(statuses)(
    "decoded.type is the body's own type verbatim, independent of status (status=%i)",
    async (status) => {
      const response = makeResponse(
        {
          kind: "a_kind_this_client_does_not_know",
          type: "billing.card_declined",
          message: "card was declined",
        },
        status,
      );

      const decoded = (await failureFromResponse(response)) as {
        kind: string;
        type?: string;
      };

      expect(decoded.type).toBe("billing.card_declined");
    },
  );

  const unrecognizedKindShapes = [
    "nonexistent_kind",
    "KIND_WITH_UPPERCASE",
    "kind-with-dashes",
    "network_error_typo",
    "123_numeric_looking_kind",
    "kind.with.dots",
  ];

  test.each(unrecognizedKindShapes)(
    "the unrecognized kind %j never surfaces as decoded.type when the body also carries a type",
    async (rawKind) => {
      const response = makeResponse(
        {
          kind: rawKind,
          type: "inventory.out_of_stock",
          message: "no stock available",
        },
        500,
      );

      const decoded = (await failureFromResponse(response)) as {
        kind: string;
        type?: string;
      };

      expect(decoded.type).toBe("inventory.out_of_stock");
      expect(decoded.type).not.toBe(rawKind);
    },
  );
});

describe("property: which field wins does not depend on the order the wire document names them in", () => {
  test("kind-before-type and type-before-kind decode to the same type and the same kind", async () => {
    const kindFirst = makeRawResponse(
      '{"kind":"unrecognized_widget_fault","type":"billing.card_declined","message":"card declined"}',
      402,
    );
    const typeFirst = makeRawResponse(
      '{"type":"billing.card_declined","kind":"unrecognized_widget_fault","message":"card declined"}',
      402,
    );

    const decodedKindFirst = (await failureFromResponse(kindFirst)) as {
      kind: string;
      type?: string;
    };
    const decodedTypeFirst = (await failureFromResponse(typeFirst)) as {
      kind: string;
      type?: string;
    };

    expect(decodedTypeFirst.type).toBe("billing.card_declined");
    expect(decodedKindFirst.type).toBe(decodedTypeFirst.type);
    expect(decodedKindFirst.kind).toBe(decodedTypeFirst.kind);
  });
});

describe("contract: the unrecognized kind is dropped, not kept, once a type is present", () => {
  test("a body naming both an unrecognized kind and its own type keeps the type and drops the kind entirely", async () => {
    const response = makeResponse(
      {
        kind: "a_kind_this_client_does_not_know",
        type: "shipment.address_undeliverable",
        message: "address could not be validated",
      },
      500,
    );

    const decoded = (await failureFromResponse(response)) as {
      kind: string;
      type?: string;
    };

    // "the body's type wins"
    expect(decoded.type).toBe("shipment.address_undeliverable");

    // "the unrecognised kind is not kept" — not kept means not kept anywhere,
    // including as the decoded classification itself. The classification must
    // still land on one of the ten known kinds (closed union, decided by
    // status elsewhere), never on the server's raw unrecognized string.
    expect(decoded.kind).not.toBe("a_kind_this_client_does_not_know");
    expect(knownKinds.includes(decoded.kind)).toBe(true);
  });

  // INFERENCE: the spec states, generally (H6b), that "a value of the wrong
  // type is IGNORED rather than refused," and states the precedence clause
  // (H8) applies "when a body carries ... its own `type`." Read together,
  // this suggests a non-string `type` does not count as "carrying" one, so
  // the ordinary preservation behavior (kind captured into decoded.type)
  // should still apply rather than the precedence override. The spec never
  // states this combination directly — it is inferred by composing two
  // separate sentences, not quoted from either. This is the test most
  // likely to disagree with an implementation that only checks for the
  // *presence* of a `type` key rather than its type.
  test('INFERENCE: a wrongly-typed `type` value does not count as the body "carrying its own type", so the unrecognized kind is preserved instead', async () => {
    const response = makeResponse(
      {
        kind: "unrecognized_odd_fault",
        type: 12345,
        message: "oops",
      },
      500,
    );

    const decoded = (await failureFromResponse(response)) as {
      kind: string;
      type?: string;
    };

    expect(decoded.type).toBe("unrecognized_odd_fault");
  });
});
