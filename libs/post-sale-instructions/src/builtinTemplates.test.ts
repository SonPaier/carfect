import { describe, it, expect } from 'vitest';
import { BUILTIN_TEMPLATES } from './builtinTemplates';
import type { TiptapNode } from './types';

const SUPPORTED_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'bulletList',
  'orderedList',
  'listItem',
  'text',
  'hardBreak',
]);

const SUPPORTED_MARK_TYPES = new Set(['bold', 'link']);

function walkNodes(node: TiptapNode): TiptapNode[] {
  const result: TiptapNode[] = [node];
  if (node.content) {
    for (const child of node.content) {
      result.push(...walkNodes(child));
    }
  }
  return result;
}

describe('BUILTIN_TEMPLATES', () => {
  it('exposes both expected built-in keys (ppf, ceramic)', () => {
    const keys = BUILTIN_TEMPLATES.map((t) => t.key);
    expect(keys).toContain('ppf');
    expect(keys).toContain('ceramic');
    expect(BUILTIN_TEMPLATES).toHaveLength(2);
  });

  it('returns a valid Tiptap doc node for each template', () => {
    for (const template of BUILTIN_TEMPLATES) {
      const doc = template.getContent();
      expect(doc.type).toBe('doc');
      expect(Array.isArray(doc.content)).toBe(true);
      expect(doc.content.length).toBeGreaterThan(0);
    }
  });

  it('does not include any node type outside the supported toolbar set', () => {
    for (const template of BUILTIN_TEMPLATES) {
      const doc = template.getContent();
      // doc itself is a TiptapNode with type 'doc'
      const allNodes = walkNodes(doc as unknown as TiptapNode);

      for (const node of allNodes) {
        expect(
          SUPPORTED_NODE_TYPES.has(node.type),
          `Template "${template.key}" contains unsupported node type: "${node.type}"`,
        ).toBe(true);

        if (node.marks) {
          for (const mark of node.marks) {
            expect(
              SUPPORTED_MARK_TYPES.has(mark.type),
              `Template "${template.key}" contains unsupported mark type: "${mark.type}"`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('uses the correct Polish title strings advertised by the registry entry', () => {
    expect(BUILTIN_TEMPLATES[0].titlePl).toContain('PPF');
    expect(BUILTIN_TEMPLATES[1].titlePl).toContain('powłoki');
    expect(BUILTIN_TEMPLATES[0].titleEn).toContain('PPF');
    expect(BUILTIN_TEMPLATES[1].titleEn).toContain('Ceramic');
  });
});
