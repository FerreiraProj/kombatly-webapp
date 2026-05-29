import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000';
  const loginUrl = new URL('/login', `${proto}://${host}`);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete('refresh_token');
  return res;
}
