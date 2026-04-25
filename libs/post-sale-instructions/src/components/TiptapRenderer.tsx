import { Fragment } from 'react';
import type { TiptapDocument, TiptapNode, TiptapMark } from '../types';

interface TiptapRendererProps {
  doc: TiptapDocument;
}

function applyMarks(text: string, marks: TiptapMark[] | undefined): React.ReactNode {
  let node: React.ReactNode = text;
  if (!marks) return node;
  for (const mark of marks) {
    if (mark.type === 'bold') {
      node = <strong>{node}</strong>;
    } else if (mark.type === 'italic') {
      node = <em>{node}</em>;
    } else if (mark.type === 'underline') {
      node = <u>{node}</u>;
    } else if (mark.type === 'link') {
      const href = (mark.attrs?.href as string) ?? '#';
      node = (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {node}
        </a>
      );
    }
  }
  return node;
}

function renderNode(node: TiptapNode, key: number | string): React.ReactNode {
  if (node.type === 'text') {
    return <Fragment key={key}>{applyMarks(node.text ?? '', node.marks)}</Fragment>;
  }
  const children = (node.content ?? []).map((child, i) => renderNode(child, i));
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>;
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof React.JSX.IntrinsicElements;
      return <Tag key={key}>{children}</Tag>;
    }
    case 'hardBreak':
      return <br key={key} />;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function TiptapRenderer({ doc }: TiptapRendererProps) {
  const content = doc.content ?? [];
  return <>{content.map((node, i) => renderNode(node, i))}</>;
}
