import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import { BlogPost } from '@/lib/blog';

interface BlogHeroProps {
  post: BlogPost;
}

export default function BlogHero({ post }: BlogHeroProps) {
  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <Link
          href={`/blog/${post.slug}`}
          className="block max-w-6xl mx-auto group"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Content */}
            <div>
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                {post.title}
              </h1>
              <p className="text-foreground/70 text-lg mb-6">
                {post.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
