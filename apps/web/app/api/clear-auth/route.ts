import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete('refresh_token');
  return res;
}
