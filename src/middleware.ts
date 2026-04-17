import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                       req.nextUrl.pathname.startsWith("/register");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
    const isProviderPage = req.nextUrl.pathname.startsWith("/provider");
    const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
    const isBookPage = req.nextUrl.pathname.includes("/book");

    if (token?.isBanned) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      // Redirect to appropriate dashboard based on role
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (token?.role === "PROVIDER") {
        return NextResponse.redirect(new URL("/provider", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Unauthenticated user on protected routes
    if (!token && (isAdminPage || isProviderPage || isDashboard || isBookPage)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check admin access
    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isProviderPage && token?.role !== "PROVIDER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect admin from user dashboard to admin panel
    if (isDashboard && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if ((isDashboard || isBookPage) && token?.role === "PROVIDER") {
      return NextResponse.redirect(new URL("/provider", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                          req.nextUrl.pathname.startsWith("/register");
        
        // Allow access to auth pages
        if (isAuthPage) return true;
        
        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/provider/:path*",
    "/login",
    "/register",
    "/services/:path*/book",
  ],
};
