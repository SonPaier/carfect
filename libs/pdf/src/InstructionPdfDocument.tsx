import React from 'react';
import { Document, Page, View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { registerFonts } from './fonts';
import type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';

// Re-export types so consumers can import from a single location
export type { TiptapDocument, TiptapNode, TiptapTextNode, TiptapElementNode } from './tiptapText';
// Re-export the pure helper
export { flattenTiptapToText } from './tiptapText';

// ─── react-pdf styles ───

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    paddingTop: 70,
    paddingBottom: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#111111',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    fontSize: 8,
  },
  headerLogo: {
    maxWidth: 80,
    maxHeight: 40,
    objectFit: 'contain',
  },
  headerInstanceName: {
    fontSize: 8,
    color: '#555555',
    textAlign: 'right',
  },
  headerSeparator: {
    position: 'absolute',
    top: 63,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#2563eb',
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
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 7,
    color: '#444444',
  },
  footerContact: {
    flexDirection: 'row',
    gap: 8,
  },
  footerPageNumber: {
    textAlign: 'right',
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

  const footerParts = [instance.phone, instance.email, instance.website].filter(
    (p): p is string => Boolean(p),
  );

  const nodes = content.content ?? [];

  return (
    <Document title={title} language="pl">
      <Page size="A4" style={styles.page}>
        {/* Fixed header */}
        <View fixed style={styles.header}>
          {logoBuffer ? (
            <Image src={{ data: logoBuffer, format: 'png' }} style={styles.headerLogo} />
          ) : (
            <View />
          )}
          {instance.name ? (
            <Text style={styles.headerInstanceName}>{instance.name}</Text>
          ) : (
            <View />
          )}
        </View>

        {/* Separator line */}
        <View fixed style={styles.headerSeparator} />

        {/* Instruction title */}
        <Text style={styles.title}>{title}</Text>

        {/* Tiptap content */}
        {nodes.map((node, i) => renderTiptapNode(node, i))}

        {/* Fixed footer */}
        {footerParts.length > 0 && (
          <View fixed style={styles.footer}>
            <View style={styles.footerContact}>
              {footerParts.map((part, i) => (
                <Text key={i}>{part}</Text>
              ))}
            </View>
            <Text
              style={styles.footerPageNumber}
              render={({ pageNumber, totalPages }) => `Strona ${pageNumber} z ${totalPages}`}
            />
          </View>
        )}
      </Page>
    </Document>
  );
}
