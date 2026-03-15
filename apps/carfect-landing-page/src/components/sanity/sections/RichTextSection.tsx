import { PortableText } from '@portabletext/react';
import type { RichTextSection as RichTextSectionType } from '@/types/sanity';

interface RichTextSectionProps {
  data: RichTextSectionType;
}

export default function RichTextSection({ data }: RichTextSectionProps) {
  return (
    <section className="py-10 md:py-14">
      <div className="container px-4">
        <article className="max-w-3xl mx-auto prose prose-lg prose-slate dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-ul:text-foreground/80 prose-ol:text-foreground/80 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-img:rounded-2xl prose-img:my-8 max-w-none">
          {data.heading && <h2>{data.heading}</h2>}
          {data.body && <PortableText value={data.body} />}
        </article>
      </div>
    </section>
  );
}
