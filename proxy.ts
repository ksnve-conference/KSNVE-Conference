import { NextResponse, type NextRequest } from 'next/server';
import { conferenceConfig } from '@/lib/conference-config';

// Submitted original pages stay private until conferenceConfig.originalPagesPublic is switched on.
// Figure crops (pNNN-figures.webp) remain public.
export function proxy(request: NextRequest) {
  if (!conferenceConfig.originalPagesPublic && /^\/paper-pages\/p\d{3}\.webp$/.test(request.nextUrl.pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/paper-pages/:path*' };
