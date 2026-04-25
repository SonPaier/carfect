import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { registerFonts } from './fonts';
import { baseStyles, defaultPdfConfig } from './styles';
import type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';

// Re-export types so consumers can import from a single location
export type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';
// Re-export the pure helper
export { flattenTiptapToText } from './tiptapText';

// ─── Instruction-specific tweaks layered on baseStyles (shared with offers) ───

const styles = StyleSheet.create({
  headerInstanceName: {
    fontSize: 8,
    color: '#555555',
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
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

function renderTiptapNode(node: TiptapNode, key: number): React.ReactNode {
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
        {children.map((child, i) => renderTiptapNode(child, i))}
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
              {innerChildren.map((child, ci) => renderTiptapNode(child, ci))}
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
              {innerChildren.map((child, ci) => renderTiptapNode(child, ci))}
            </Text>
          );
        })}
      </View>
    );
  }

  if (el.type === 'listItem') {
    return (
      <React.Fragment key={key}>
        {children.map((child, i) => renderTiptapNode(child, i))}
      </React.Fragment>
    );
  }

  if (el.type === 'heading') {
    const level = (el.attrs as { level?: number } | undefined)?.level ?? 2;
    const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
    return (
      <Text key={key} style={headingStyle}>
        {children.map((child, i) => renderTiptapNode(child, i))}
      </Text>
    );
  }

  if (el.type === 'image') {
    const attrs = el.attrs as { src?: string; align?: string } | undefined;
    const src = attrs?.src;
    if (!src) return null;
    const align = attrs?.align ?? 'center';
    // react-pdf has no float — map left/right/center to alignSelf,
    // map full to a 100% width block.
    const alignedStyle =
      align === 'full'
        ? { ...styles.image, width: '100%' }
        : align === 'left'
          ? { ...styles.image, alignSelf: 'flex-start' as const, width: '50%' }
          : align === 'right'
            ? { ...styles.image, alignSelf: 'flex-end' as const, width: '50%' }
            : { ...styles.image, alignSelf: 'center' as const, width: '70%' };
    return <Image key={key} src={src} style={alignedStyle} />;
  }

  // Unknown node: render children only (graceful fallback)
  return (
    <React.Fragment key={key}>
      {children.map((child, i) => renderTiptapNode(child, i))}
    </React.Fragment>
  );
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
}

// ─── Main component ───

export function InstructionPdfDocument({
  title,
  content,
  instance,
  logoBuffer,
}: InstructionPdfDocumentProps) {
  registerFonts();

  const nodes = content.content ?? [];
  const accentColor = defaultPdfConfig.accentColor;
  const footerParts = [instance.name, instance.phone, instance.email].filter((p): p is string =>
    Boolean(p),
  );

  return (
    <Document title={title} language="pl">
      <Page size="A4" style={baseStyles.page}>
        {/* Fixed header — mirrors PdfHeader (offer PDF) so instructions stay
            visually consistent with offer documents. */}
        <View fixed style={baseStyles.header}>
          {logoBuffer ? (
            <Image src={{ data: logoBuffer, format: 'png' }} style={baseStyles.headerLogo} />
          ) : (
            <View />
          )}
          {instance.name ? (
            <Text style={styles.headerInstanceName}>{instance.name}</Text>
          ) : (
            <View />
          )}
        </View>

        {/* Accent separator */}
        <View fixed style={[baseStyles.headerSeparator, { backgroundColor: accentColor }]} />

        {/* Instruction title */}
        <Text style={styles.title}>{title}</Text>

        {/* Tiptap content */}
        {nodes.map((node, i) => renderTiptapNode(node, i))}

        {/* Fixed footer — mirrors PdfFooter (offer PDF) */}
        <View fixed style={baseStyles.footer}>
          <View style={{ flex: 1 }}>
            {footerParts.length > 0 && (
              <View style={baseStyles.footerCompanyInfo}>
                {footerParts.map((part, i) => (
                  <Text key={i}>{part}</Text>
                ))}
              </View>
            )}
            <Text
              style={{ fontSize: 7, color: '#b0b0b0', marginTop: 2 }}
              render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
                pageNumber === totalPages
                  ? 'Dokument przygotowano w systemie do zarządzania studiem detailingu — carfect.pl'
                  : ''
              }
            />
          </View>
          <Text
            style={baseStyles.footerPageNumber}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Strona ${pageNumber} z ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
