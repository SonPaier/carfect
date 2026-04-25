export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export type ImageAlign = 'left' | 'center' | 'right' | 'full';

/**
 * Tailwind classes applied to inline images by alignment. Shared between the
 * editor (used inside the AlignedImage extension) and the customer-facing
 * renderer so both views match.
 */
export const IMAGE_ALIGN_CLASS: Record<ImageAlign, string> = {
  left: 'float-left mr-4 mb-2 max-w-[45%]',
  right: 'float-right ml-4 mb-2 max-w-[45%]',
  center: 'block mx-auto my-2 max-w-[80%]',
  full: 'block w-full my-2',
};
