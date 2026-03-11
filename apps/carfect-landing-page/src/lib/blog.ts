import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  image: string;
  featured: boolean;
  content: string;
  readingTime: string;
}

export function getAllPosts(): BlogPost[] {
  const postsDirectory = path.join(process.cwd(), 'content/blog');

  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Untitled',
        description: data.description || '',
        category: data.category || 'Bez kategorii',
        date: data.date || new Date().toISOString(),
        author: data.author || 'Carfect Team',
        image: data.image || '/images/blog/placeholder.jpg',
        featured: data.featured || false,
        content,
        readingTime: readingTime(content).text,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.slug === slug) || null;
}

export function getFeaturedPost(): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.featured) || posts[0] || null;
}
