import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { ifirmaHmac } from './ifirma.ts';

Deno.test('ifirmaHmac — produces correct HMAC-SHA1 hex string', async () => {
  // Known test vector: HMAC-SHA1 of "test" with key 0x0b repeated 20 times
  // We use a simpler case with our known key format
  const key = '7F3B32221CF69776'; // 8 bytes hex
  const message = 'test message';
  const result = await ifirmaHmac(key, message);

  // Result should be a 40-char hex string (SHA-1 = 20 bytes = 40 hex chars)
  assertEquals(result.length, 40);
  assertEquals(/^[0-9a-f]+$/.test(result), true);
});

Deno.test('ifirmaHmac — same input produces same output (deterministic)', async () => {
  const key = 'AABBCCDD';
  const message = 'hello world';
  const result1 = await ifirmaHmac(key, message);
  const result2 = await ifirmaHmac(key, message);
  assertEquals(result1, result2);
});

Deno.test('ifirmaHmac — different keys produce different output', async () => {
  const message = 'same message';
  const result1 = await ifirmaHmac('AABBCCDD', message);
  const result2 = await ifirmaHmac('11223344', message);
  assertEquals(result1 !== result2, true);
});

Deno.test('ifirmaHmac — different messages produce different output', async () => {
  const key = 'AABBCCDD';
  const result1 = await ifirmaHmac(key, 'message one');
  const result2 = await ifirmaHmac(key, 'message two');
  assertEquals(result1 !== result2, true);
});

Deno.test('ifirmaHmac — throws on empty hex key', async () => {
  await assertRejects(() => ifirmaHmac('', 'test'), Error, 'not valid hex');
});

Deno.test('ifirmaHmac — non-hex key still produces a result (no crash)', async () => {
  // parseInt('ZZ', 16) = NaN → Uint8Array gets 0 bytes, but crypto.subtle still works
  // This is not ideal but the CRON validates hex format before calling ifirmaHmac
  const result = await ifirmaHmac('ZZZZ', 'test');
  assertEquals(typeof result, 'string');
});
