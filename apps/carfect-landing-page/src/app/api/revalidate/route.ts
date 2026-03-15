import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const secret = req.headers.get('x-sanity-webhook-secret');
    if (process.env.SANITY_WEBHOOK_SECRET && secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    const { _type } = body;

    if (_type === 'blogPost') {
      revalidateTag('blogPost', 'max');
    } else if (_type === 'page') {
      revalidateTag('pages', 'max');
    } else if (_type === 'siteSettings') {
      revalidateTag('settings', 'max');
    } else if (_type === 'pricingConfig') {
      revalidateTag('sanity', 'max');
    } else if (_type === 'caseStudy') {
      revalidateTag('sanity', 'max');
    } else if (_type === 'legalPage') {
      revalidateTag('sanity', 'max');
    }

    revalidateTag('sanity', 'max');

    return NextResponse.json({ revalidated: true, type: _type });
  } catch {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
