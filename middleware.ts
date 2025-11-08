import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is trying to access login page
  // Note: We can't check localStorage in middleware, so we'll handle this in the login page component
  // This middleware is mainly for future use if we add server-side auth checks
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sleep.png (logo file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sleep.png).*)',
  ],
};

