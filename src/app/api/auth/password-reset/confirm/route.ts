import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/email-verification";
import {
  getPasswordStrength,
  getPwnedPasswordCount,
  MIN_PASSWORD_LENGTH,
  MIN_PASSWORD_SCORE,
} from "@/lib/password-security";
import { renderPasswordUpdatedEmail, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (getPasswordStrength(password).score < MIN_PASSWORD_SCORE) {
      return NextResponse.json({ error: "Password is too weak" }, { status: 400 });
    }
    if ((await getPwnedPasswordCount(password)) > 0) {
      return NextResponse.json(
        { error: "This password has appeared in known data breaches. Please choose another one." },
        { status: 400 }
      );
    }

    const email = await consumePasswordResetToken(token);
    if (!email) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed },
      select: { email: true, name: true },
    });

    await sendEmail({
      to: updated.email,
      subject: "Password updated - The Hood",
      html: renderPasswordUpdatedEmail(updated.name || "there"),
    }).catch((error) => console.error("Password updated email error:", error));

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

