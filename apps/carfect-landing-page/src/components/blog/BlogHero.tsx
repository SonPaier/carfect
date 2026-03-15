import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { BlogPost } from '@/lib/blog';
import { urlFor } from '@/lib/sanity/image';

interface BlogHeroProps {
  post: BlogPost;
}

export default function BlogHero({ post }: BlogHeroProps) {
  const imageUrl = post.coverImage ? urlFor(post.coverImage).width(800).height(500).url() : null;

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <Link
          href={`/blog/${post.slug.current}`}
          className="block max-w-6xl mx-auto group"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {imageUrl && (
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            )}

            <div>
              {post.category && (
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
                  {post.category.title}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                {post.title}
              </h1>
              <p className="text-foreground/70 text-lg mb-6">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
