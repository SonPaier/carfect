import { assertEquals } from 'jsr:@std/assert';
import { resolveSmsTemplate, resolvePlaceholders, buildReminderEmailHtml } from './helpers.ts';

const FALLBACKS: Record<string, string> = {
  serwis: 'Serwis fallback: {vehicle_plate}',
  kontrola: 'Kontrola fallback: {vehicle_plate}',
};

Deno.test('resolveSmsTemplate — uses db template when sms_template is set', () => {
  const result = resolveSmsTemplate('Custom SMS: {vehicle_plate}', 'serwis', FALLBACKS);
  assertEquals(result, 'Custom SMS: {vehicle_plate}');
});

Deno.test('resolveSmsTemplate — falls back to SMS_TEMPLATES[service_type] when db template is null', () => {
  const result = resolveSmsTemplate(null, 'kontrola', FALLBACKS);
  assertEquals(result, 'Kontrola fallback: {vehicle_plate}');
});

Deno.test('resolveSmsTemplate — falls back to SMS_TEMPLATES.serwis when service_type not in fallbacks', () => {
  const result = resolveSmsTemplate(null, 'unknown_type', FALLBACKS);
  assertEquals(result, 'Serwis fallback: {vehicle_plate}');
});

Deno.test('resolveSmsTemplate — falls back when db template is empty string', () => {
  const result = resolveSmsTemplate('', 'serwis', FALLBACKS);
  assertEquals(result, 'Serwis fallback: {vehicle_plate}');
});

// --- resolvePlaceholders ---

Deno.test('resolvePlaceholders — replaces Polish aliases', () => {
  const template = 'Witaj {imie_klienta}, pojazd {pojazd}, tel {telefon_firmy}';
  const vars = {
    imie_klienta: 'Jan Kowalski',
    pojazd: 'BMW 320d',
    telefon_firmy: '123456789',
  };
  assertEquals(result(template, vars), 'Witaj Jan Kowalski, pojazd BMW 320d, tel 123456789');

  function result(t: string, v: Record<string, string>) {
    return resolvePlaceholders(t, v);
  }
});

Deno.test('resolvePlaceholders — replaces legacy English placeholders', () => {
  const template = '{short_name}: pojazd {vehicle_plate}, tel {reservation_phone}';
  const vars = {
    short_name: 'Armcar',
    vehicle_plate: 'Porsche 911',
    reservation_phone: '500100200',
  };
  assertEquals(
    resolvePlaceholders(template, vars),
    'Armcar: pojazd Porsche 911, tel 500100200',
  );
});

Deno.test('resolvePlaceholders — missing vars resolve to empty string', () => {
  const result = resolvePlaceholders('Hello {unknown_var}!', {});
  assertEquals(result, 'Hello !');
});

Deno.test('resolvePlaceholders — multiple same variable in one template', () => {
  const result = resolvePlaceholders('{name} i {name}', { name: 'X' });
  assertEquals(result, 'X i X');
});

Deno.test('resolvePlaceholders — no placeholders returns template unchanged', () => {
  const result = resolvePlaceholders('Zwykły tekst bez zmiennych', { foo: 'bar' });
  assertEquals(result, 'Zwykły tekst bez zmiennych');
});

Deno.test('resolvePlaceholders — both Polish and legacy vars coexist', () => {
  const template = '{short_name}: {pojazd} ({vehicle_plate})';
  const vars = {
    short_name: 'Armcar',
    pojazd: 'BMW 320d',
    vehicle_plate: 'BMW 320d',
  };
  assertEquals(resolvePlaceholders(template, vars), 'Armcar: BMW 320d (BMW 320d)');
});

// --- buildReminderEmailHtml ---

Deno.test('buildReminderEmailHtml — includes logo img when logoUrl provided', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'Test',
    instanceLogoUrl: 'https://example.com/logo.png',
    body: 'Body text',
  });
  assertEquals(html.includes('img src="https://example.com/logo.png"'), true);
  assertEquals(html.includes('Body text'), true);
});

Deno.test('buildReminderEmailHtml — shows instance name heading when no logo', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'Armcar Studio',
    instanceLogoUrl: null,
    body: 'Test body',
  });
  assertEquals(html.includes('Armcar Studio'), true);
  assertEquals(html.includes('<img'), false);
});

Deno.test('buildReminderEmailHtml — includes phone link when provided', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'Test',
    instancePhone: '+48123456789',
    body: 'Body',
  });
  assertEquals(html.includes('tel:+48123456789'), true);
});

Deno.test('buildReminderEmailHtml — omits phone when null', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'Test',
    instancePhone: null,
    body: 'Body',
  });
  assertEquals(html.includes('tel:'), false);
});

Deno.test('buildReminderEmailHtml — escapes HTML in body', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'Test',
    body: 'A&B <script>alert(1)</script>',
  });
  assertEquals(html.includes('A&amp;B'), true);
  assertEquals(html.includes('&lt;script&gt;'), true);
  assertEquals(html.includes('<script>'), false);
});

Deno.test('buildReminderEmailHtml — escapes HTML in instance name', () => {
  const html = buildReminderEmailHtml({
    instanceName: 'A&B "Studio"',
    body: 'Body',
  });
  assertEquals(html.includes('A&amp;B'), true);
  assertEquals(html.includes('&quot;Studio&quot;'), true);
});
