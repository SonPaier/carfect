import { createClient } from 'next-sanity';

export const projectId = 'ticwtj5d';
export const dataset = 'production';
export const apiVersion = '2024-01-01';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // CDN for production reads
});

// Preview client (no CDN, fresh data)
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  // token: process.env.SANITY_API_READ_TOKEN, // uncomment for draft previews
});
