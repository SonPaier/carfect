import { assertEquals } from "jsr:@std/assert";
import { createApaczkaSignature, buildApaczkaPayload } from "./client.ts";

Deno.test("APC-001: signature generates 64-char hex string", async () => {
  const sig = await createApaczkaSignature(
    "test_app_id",
    "test_secret",
    "order_send",
    '{"test":"data"}',
    1700000000,
  );
  assertEquals(sig.length, 64);
  assertEquals(/^[0-9a-f]{64}$/.test(sig), true);
});

Deno.test("APC-002: signature is deterministic", async () => {
  const sig1 = await createApaczkaSignature("id", "secret", "route", "{}", 123);
  const sig2 = await createApaczkaSignature("id", "secret", "route", "{}", 123);
  assertEquals(sig1, sig2);
});

Deno.test("APC-003: different inputs produce different signatures", async () => {
  const sig1 = await createApaczkaSignature("id", "secret", "route_a", "{}", 123);
  const sig2 = await createApaczkaSignature("id", "secret", "route_b", "{}", 123);
  assertEquals(sig1 !== sig2, true);
});

Deno.test("APC-004: different secrets produce different signatures", async () => {
  const sig1 = await createApaczkaSignature("id", "secret1", "route", "{}", 123);
  const sig2 = await createApaczkaSignature("id", "secret2", "route", "{}", 123);
  assertEquals(sig1 !== sig2, true);
});

Deno.test("APC-005: buildApaczkaPayload sets expires ~25 min in future", async () => {
  const before = Math.floor(Date.now() / 1000);
  const payload = await buildApaczkaPayload(
    { appId: "test_id", appSecret: "test_secret" },
    "order_send",
    { foo: "bar" },
  );
  const after = Math.floor(Date.now() / 1000);

  assertEquals(payload.app_id, "test_id");
  assertEquals(payload.request, JSON.stringify({ foo: "bar" }));
  assertEquals(typeof payload.signature, "string");
  assertEquals(payload.signature.length, 64);
  // Expires should be ~25 min from now (24-26 min tolerance)
  assertEquals(payload.expires >= before + 24 * 60, true);
  assertEquals(payload.expires <= after + 26 * 60, true);
});

Deno.test("APC-006: buildApaczkaPayload stringifies request correctly", async () => {
  const payload = await buildApaczkaPayload(
    { appId: "id", appSecret: "secret" },
    "order_send",
    { order: { service_id: 1, shipment: [] } },
  );
  const parsed = JSON.parse(payload.request);
  assertEquals(parsed.order.service_id, 1);
  assertEquals(Array.isArray(parsed.order.shipment), true);
});
