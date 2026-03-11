import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, User } from 'lucide-react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { BlogPost } from '@/lib/blog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPostLayoutProps {
  post: BlogPost;
}

const components = {
  a: (props: unknown) => {
    const { href, children } = props as { href?: string; children?: React.ReactNode };
    const isExternal = href?.startsWith('http');
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return <Link href={href || '#'}>{children}</Link>;
  },
};

export default function BlogPostLayout({ post }: BlogPostLayoutProps) {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-10 md:pb-14 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.date).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readingTime}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </span>
              </div>

              {/* Featured Image */}
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
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
              prose-table:text-sm prose-table:block prose-table:overflow-x-auto
              prose-thead:bg-muted/50
              prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold
              prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-border
              max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {post.content}
              </ReactMarkdown>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
