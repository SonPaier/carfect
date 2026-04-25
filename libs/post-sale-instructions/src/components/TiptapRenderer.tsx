import { Fragment } from 'react';
import { IMAGE_ALIGN_CLASS, type ImageAlign } from '@shared/ui';
import type { TiptapDocument, TiptapNode, TiptapMark } from '../types';

interface TiptapRendererProps {
  doc: TiptapDocument;
}

/** Allow only http(s) urls; everything else (incl. javascript:) becomes '#'. */
const safeHref = (href: string | undefined): string =>
  href && /^https?:\/\//i.test(href) ? href : '#';

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
      const href = safeHref(mark.attrs?.href as string | undefined);
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
    case 'image': {
      const rawSrc = (node.attrs?.src as string | undefined) ?? '';
      // Reject non-http(s) image sources — Tiptap will accept javascript:/data:
      // URIs in the JSON which we never want to render.
      const src = /^https?:\/\//i.test(rawSrc) ? rawSrc : '';
      const alt = (node.attrs?.alt as string | undefined) ?? '';
      const align = (node.attrs?.align as ImageAlign | undefined) ?? 'center';
      if (!src) return null;
      return (
        <img
          key={key}
          src={src}
          alt={alt}
          className={`${IMAGE_ALIGN_CLASS[align]} h-auto rounded-md`}
        />
      );
    }
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function TiptapRenderer({ doc }: TiptapRendererProps) {
  const content = doc.content ?? [];
  return <>{content.map((node, i) => renderNode(node, i))}</>;
}
