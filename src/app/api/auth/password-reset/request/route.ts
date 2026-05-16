import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/email-verification";
import { renderPasswordResetEmail, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found for this email" }, { status: 404 });
    }

    // User-requested flow: invalidate current password until reset completes.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: null },
    });

    const token = await createPasswordResetToken(user.email);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password - The Hood",
      html: renderPasswordResetEmail(user.name || "there", resetUrl),
    });

    return NextResponse.json({
      message:
        "Password reset link sent. Please check your Inbox or Junk/Spam folder.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 });
  }
}

