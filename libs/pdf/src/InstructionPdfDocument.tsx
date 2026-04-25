import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { registerFonts } from './fonts';
import { baseStyles, defaultPdfConfig } from './styles';
import { PdfHeader } from './components/PdfHeader';
import { PdfFooter } from './components/PdfFooter';
import type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';
import type { PrefetchedImage } from './prefetchImages';

// Re-export types so consumers can import from a single location
export type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';
// Re-export the pure helper
export { flattenTiptapToText } from './tiptapText';
export { prefetchInstructionImages, collectImageUrls, detectImageFormat } from './prefetchImages';
export type { PrefetchedImage, ImageFormat } from './prefetchImages';

// ─── Instruction-specific tweaks layered on baseStyles (shared with offers) ───

const styles = StyleSheet.create({
  // Section-style instruction title — matches the inline bold heading
  // used by offers (e.g. "Dane klienta i pojazdu", "Usługi") instead of
  // a centered cover-page title.
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 12,
    color: '#111111',
  },
  paragraph: {
    marginBottom: 4,
    lineHeight: 1.5,
    fontSize: 10,
  },
  h1: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: '#111111' },
  h2: { fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#111111' },
  h3: { fontSize: 12, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#111111' },
  image: { marginVertical: 6, maxWidth: '100%' },
  // Image+text wrap: emulates float:left/right by putting them in a row.
  // Used when an image has align='left' or 'right' and is followed by paragraphs.
  imageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  imageRowText: {
    flex: 1,
    flexDirection: 'column',
  },
  listView: {
    marginBottom: 4,
  },
  listItem: {
    marginBottom: 2,
    lineHeight: 1.5,
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
});

// ─── Tiptap → react-pdf recursive renderer ───

function renderTextNode(node: TiptapTextNode): React.ReactNode {
  const marks = node.marks ?? [];
  let content: React.ReactNode = node.text;

  for (const mark of marks) {
    if (mark.type === 'bold') {
      content = <Text style={styles.bold}>{content}</Text>;
    } else if (mark.type === 'link') {
      const href = (mark.attrs as { href?: string } | undefined)?.href ?? '';
      content = <Link src={href}>{content}</Link>;
    }
  }

  return content;
}

function renderTiptapNode(
  node: TiptapNode,
  key: number,
  imageBuffers: Map<string, PrefetchedImage>,
): React.ReactNode {
  if (node.type === 'text') {
    return renderTextNode(node as TiptapTextNode);
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  const el = node as TiptapElementNode;
  const children = el.content ?? [];

  if (el.type === 'paragraph') {
    return (
      <Text key={key} style={styles.paragraph}>
        {children.map((child, i) => renderTiptapNode(child, i, imageBuffers))}
      </Text>
    );
  }

  if (el.type === 'bulletList') {
    return (
      <View key={key} style={styles.listView}>
        {children.map((item, i) => {
          const itemEl = item as TiptapElementNode;
          const itemChildren = itemEl.content ?? [];
          // listItem wraps a paragraph; unwrap one level to get the inline content
          const innerChildren =
            (itemChildren[0] as TiptapElementNode | undefined)?.content ?? itemChildren;
          return (
            <Text key={i} style={styles.listItem}>
              {'• '}
              {innerChildren.map((child, ci) => renderTiptapNode(child, ci, imageBuffers))}
            </Text>
          );
        })}
      </View>
    );
  }

  if (el.type === 'orderedList') {
    return (
      <View key={key} style={styles.listView}>
        {children.map((item, i) => {
          const itemEl = item as TiptapElementNode;
          const itemChildren = itemEl.content ?? [];
          const innerChildren =
            (itemChildren[0] as TiptapElementNode | undefined)?.content ?? itemChildren;
          return (
            <Text key={i} style={styles.listItem}>
              {`${i + 1}. `}
              {innerChildren.map((child, ci) => renderTiptapNode(child, ci, imageBuffers))}
            </Text>
          );
        })}
      </View>
    );
  }

  if (el.type === 'listItem') {
    return (
      <React.Fragment key={key}>
        {children.map((child, i) => renderTiptapNode(child, i, imageBuffers))}
      </React.Fragment>
    );
  }

  if (el.type === 'heading') {
    const level = (el.attrs as { level?: number } | undefined)?.level ?? 2;
    const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
    return (
      <Text key={key} style={headingStyle}>
        {children.map((child, i) => renderTiptapNode(child, i, imageBuffers))}
      </Text>
    );
  }

  if (el.type === 'image') {
    return renderStandaloneImage(el, key, imageBuffers);
  }

  // Unknown node: render children only (graceful fallback)
  return (
    <React.Fragment key={key}>
      {children.map((child, i) => renderTiptapNode(child, i, imageBuffers))}
    </React.Fragment>
  );
}

function imageAttrs(el: TiptapElementNode): { src?: string; align?: string } {
  return (el.attrs as { src?: string; align?: string } | undefined) ?? {};
}

function renderStandaloneImage(
  el: TiptapElementNode,
  key: number,
  imageBuffers: Map<string, PrefetchedImage>,
): React.ReactNode {
  const { src, align = 'center' } = imageAttrs(el);
  if (!src) return null;
  // react-pdf in Node will not auto-fetch HTTP image URLs reliably, so
  // every image must be pre-fetched into a Buffer by the caller. If the
  // map has no entry, the URL was unsupported (.svg/data:/etc.) or the
  // fetch failed — drop silently rather than aborting the document.
  const prefetched = imageBuffers.get(src);
  if (!prefetched) return null;
  // react-pdf has no float — left/right paragraphs are wrapped via
  // renderImageRow. This branch handles "lone" images (no following
  // paragraphs) and the center/full cases.
  const alignedStyle =
    align === 'full'
      ? { ...styles.image, width: '100%' }
      : align === 'left'
        ? { ...styles.image, alignSelf: 'flex-start' as const, width: '50%' }
        : align === 'right'
          ? { ...styles.image, alignSelf: 'flex-end' as const, width: '50%' }
          : { ...styles.image, alignSelf: 'center' as const, width: '70%' };
  return (
    <Image
      key={key}
      src={{ data: prefetched.data, format: prefetched.format }}
      style={alignedStyle}
    />
  );
}

function renderImageRow(
  el: TiptapElementNode,
  paragraphs: TiptapElementNode[],
  key: number,
  imageBuffers: Map<string, PrefetchedImage>,
): React.ReactNode {
  const { src, align } = imageAttrs(el);
  if (!src) return null;
  const prefetched = imageBuffers.get(src);
  if (!prefetched) {
    // Image cannot be embedded — fall back to plain text below the (missing) image.
    return (
      <React.Fragment key={key}>
        {paragraphs.map((p, i) => renderTiptapNode(p, i, imageBuffers))}
      </React.Fragment>
    );
  }
  const imageNode = (
    <Image
      src={{ data: prefetched.data, format: prefetched.format }}
      style={{ ...styles.image, width: '40%', marginVertical: 0 }}
    />
  );
  const textBlock = (
    <View style={styles.imageRowText}>
      {paragraphs.map((p, i) => renderTiptapNode(p, i, imageBuffers))}
    </View>
  );
  return (
    <View key={key} style={styles.imageRow} wrap={false}>
      {align === 'right' ? textBlock : imageNode}
      {align === 'right' ? imageNode : textBlock}
    </View>
  );
}

/**
 * Renders a sequence of Tiptap nodes. When an image with align='left' or
 * align='right' is followed by paragraphs, they are grouped into a horizontal
 * row so text wraps next to the image (mirrors the editor behavior). The
 * grouping stops at the first non-paragraph (heading, list, image, etc.).
 */
function renderNodeList(
  nodes: TiptapNode[],
  imageBuffers: Map<string, PrefetchedImage>,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === 'image') {
      const el = node as TiptapElementNode;
      const align = imageAttrs(el).align;
      if (align === 'left' || align === 'right') {
        const paragraphs: TiptapElementNode[] = [];
        let j = i + 1;
        while (j < nodes.length && (nodes[j] as TiptapElementNode).type === 'paragraph') {
          paragraphs.push(nodes[j] as TiptapElementNode);
          j++;
        }
        if (paragraphs.length > 0) {
          out.push(renderImageRow(el, paragraphs, i, imageBuffers));
          i = j;
          continue;
        }
      }
    }
    out.push(renderTiptapNode(node, i, imageBuffers));
    i++;
  }
  return out;
}

// ─── Component props ───

export interface InstructionInstance {
  name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contact_person?: string;
}

export interface InstructionPdfDocumentProps {
  title: string;
  content: TiptapDocument;
  instance: InstructionInstance;
  logoBuffer: Buffer | null;
  /** URL → prefetched bytes. Provide via `prefetchInstructionImages(content)` before render. */
  imageBuffers?: Map<string, PrefetchedImage>;
}

// ─── Main component ───

export function InstructionPdfDocument({
  title,
  content,
  instance,
  logoBuffer,
  imageBuffers,
}: InstructionPdfDocumentProps) {
  registerFonts();

  const nodes = content.content ?? [];
  const accentColor = defaultPdfConfig.accentColor;
  const images = imageBuffers ?? new Map<string, PrefetchedImage>();

  return (
    <Document title={title} language="pl">
      <Page size="A4" style={baseStyles.page}>
        <PdfHeader
          companyName={instance.name}
          companyPhone={instance.phone}
          companyEmail={instance.email}
          companyAddress={instance.address}
          companyWebsite={instance.website}
          logoBuffer={logoBuffer}
          accentColor={accentColor}
        />
        <Text style={styles.title}>{title}</Text>
        {renderNodeList(nodes, images)}
        <PdfFooter
          companyName={instance.name ?? ''}
          companyPhone={instance.phone}
          companyEmail={instance.email}
        />
      </Page>
    </Document>
  );
}
