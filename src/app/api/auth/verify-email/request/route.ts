import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { renderVerifyEmailTemplate, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ message: "If account exists, verification mail was sent." });
    }
    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified." });
    }

    const token = await createEmailVerificationToken(user.email);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email - The Hood",
      html: renderVerifyEmailTemplate(user.name || "there", verifyUrl),
    });

    return NextResponse.json({ message: "Verification email sent." });
  } catch (error) {
    console.error("Verify request error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}

