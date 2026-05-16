import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?verified=missing", request.url));
    }

    const email = await consumeEmailVerificationToken(token);
    if (!email) {
      return NextResponse.redirect(new URL("/login?verified=invalid", request.url));
    }

    await prisma.user.updateMany({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.redirect(new URL("/login?verified=success", request.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }
}

