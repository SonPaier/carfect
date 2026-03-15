import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import HeaderClient from '@/components/landing/HeaderClient';
import FooterServer from '@/components/landing/FooterServer';
import { BlogPost } from '@/lib/blog';
import type { SiteSettings } from '@/types/sanity';
import { PortableText } from '@portabletext/react';
import { urlFor } from '@/lib/sanity/image';

interface BlogPostLayoutProps {
  post: BlogPost;
  settings?: SiteSettings;
}

export default function BlogPostLayout({ post, settings }: BlogPostLayoutProps) {
  const imageUrl = post.coverImage ? urlFor(post.coverImage).width(768).height(432).url() : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderClient settings={settings} />
      <main className="flex-1">
        <section className="pt-24 pb-10 md:pb-14 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              {post.category && (
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
                  {post.category.title}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.publishedAt).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {post.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                )}
              </div>

              {imageUrl && (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
                  <Image
                    src={imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14">
          <div className="container px-4">
            <article className="max-w-3xl mx-auto prose prose-lg prose-slate dark:prose-invert
              prose-headings:font-bold prose-headings:text-foreground
              prose-p:text-foreground/80 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:text-foreground/80 prose-ol:text-foreground/80
              prose-blockquote:border-l-4 prose-blockquote:border-primary
              prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-6
              prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg
              prose-img:rounded-2xl prose-img:my-8
              max-w-none">
              {post.body && <PortableText value={post.body} />}
            </article>
          </div>
        </section>
      </main>
      <FooterServer settings={settings} />
    </div>
  );
}
