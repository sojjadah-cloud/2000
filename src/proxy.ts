import { NextResponse, type NextRequest } from 'next/server';

// يمرّر المسار الحالي للخادم (لزر تبديل اللغة) ويضيف ترويسات أمان.
// التحقق الفعلي من الصلاحيات يتم في الخادم داخل كل صفحة وعملية، وليس هنا.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/submit/track')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/|demo/|vendor/).*)'],
};
