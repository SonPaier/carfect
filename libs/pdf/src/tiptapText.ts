// Pure Tiptap-to-text helper — no react-pdf imports, safe to use in tests and server-side

export interface TiptapTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapTextNode {
  type: 'text';
  text: string;
  marks?: TiptapTextMark[];
}

export interface TiptapElementNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
}

export type TiptapNode = TiptapTextNode | TiptapElementNode;

export interface TiptapDocument {
  type: 'doc';
  content?: TiptapNode[];
}

/**
 * Flattens a Tiptap JSON document to a plain string.
 * Used in tests (no react-pdf dependency) and as a utility.
 *
 * Mapping rules (mirrors spec section 7):
 * - paragraph → text + trailing newline
 * - bulletList items → "• item\n"
 * - orderedList items → "N. item\n"
 * - text nodes → their text value (marks are ignored for plain-text output)
 * - hardBreak → "\n"
 * - unknown types → flatten children only (graceful fallback)
 */
export function flattenTiptapToText(doc: TiptapDocument): string {
  return flattenNodes(doc.content ?? []);
}

function flattenNodes(nodes: TiptapNode[]): string {
  return nodes.map(flattenNode).join('');
}

function flattenNode(node: TiptapNode): string {
  if (node.type === 'text') {
    const textNode = node as TiptapTextNode;
    return textNode.text;
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  const el = node as TiptapElementNode;
  const children = el.content ?? [];

  if (el.type === 'paragraph') {
    return flattenNodes(children) + '\n';
  }

  if (el.type === 'bulletList') {
    return children
      .map((item) => {
        const itemEl = item as TiptapElementNode;
        const inner = flattenNodes(itemEl.content ?? []);
        return '• ' + inner.replace(/\n$/, '') + '\n';
      })
      .join('');
  }

  if (el.type === 'orderedList') {
    return children
      .map((item, i) => {
        const itemEl = item as TiptapElementNode;
        const inner = flattenNodes(itemEl.content ?? []);
        return `${i + 1}. ` + inner.replace(/\n$/, '') + '\n';
      })
      .join('');
  }

  if (el.type === 'listItem') {
    return flattenNodes(children);
  }

  // Unknown node: render children only (graceful fallback)
  return flattenNodes(children);
}
