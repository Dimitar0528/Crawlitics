import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hasVisitedLandingPageCookie = req.cookies.get("hasVisitedLanding");

  if (!hasVisitedLandingPageCookie) {
    if (url.pathname !== "/landing") {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
  } else {
    if (url.pathname === "/landing") {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
