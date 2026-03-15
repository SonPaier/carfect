import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BlogPost } from '@/lib/blog';
import { urlFor } from '@/lib/sanity/image';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const imageUrl = post.coverImage ? urlFor(post.coverImage).width(600).height(375).url() : null;

  return (
    <Card className="group hover:border-primary/20 transition-all overflow-hidden h-full flex flex-col">
      <Link href={`/blog/${post.slug.current}`}>
        {imageUrl && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}

        <CardHeader>
          {post.category && (
            <span className="inline-block w-fit px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-2">
              {post.category.title}
            </span>
          )}
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </CardHeader>

        <CardContent className="flex-1">
          <p className="text-foreground/70 text-sm line-clamp-3">
            {post.excerpt}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-0">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(post.publishedAt).toLocaleDateString('pl-PL')}
              </span>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </CardFooter>
      </Link>
    </Card>
  );
}
