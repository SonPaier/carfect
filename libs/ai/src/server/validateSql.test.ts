// libs/ai/src/server/validateSql.test.ts
import { describe, expect, it } from 'vitest';
import { validateSql } from './validateSql';

describe('validateSql', () => {
  it('accepts a simple SELECT', () => {
    expect(validateSql('SELECT count(*) FROM reservations')).toBeNull();
  });

  it('accepts SELECT with leading whitespace and trailing semicolons', () => {
    expect(validateSql('  SELECT 1;;;  ')).toBeNull();
  });

  it('rejects non-SELECT statements', () => {
    expect(validateSql('DELETE FROM reservations')).toMatch(/select/i);
    expect(validateSql('UPDATE reservations SET price = 0')).toMatch(/select/i);
    expect(validateSql('CREATE TABLE foo()')).toMatch(/select/i);
  });

  it('rejects multi-statement queries', () => {
    expect(validateSql('SELECT 1; SELECT 2')).toMatch(/multi-statement/i);
  });

  it('rejects DDL/DML keywords mixed in', () => {
    expect(validateSql('SELECT * FROM (INSERT INTO foo VALUES (1) RETURNING *) sub')).toMatch(
      /keyword/i,
    );
    expect(validateSql('SELECT * FROM bar /* DROP TABLE x */')).toMatch(/keyword/i);
  });

  it('case-insensitive keyword detection', () => {
    expect(validateSql('select * from x where y = (delete from z returning 1)')).toMatch(
      /keyword/i,
    );
  });
});
