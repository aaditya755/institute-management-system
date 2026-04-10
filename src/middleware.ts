import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const session = req.auth;
  const userRole = session?.user?.role;

  if (!session?.user && pathname !== "/login") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && userRole) {
    return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, req.nextUrl.origin));
  }

  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (pathname.startsWith("/faculty") && userRole !== "FACULTY") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (pathname.startsWith("/student") && userRole !== "STUDENT") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*", "/login"],
};
