import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPasswordStrength,
  getPwnedPasswordCount,
  MIN_PASSWORD_LENGTH,
  MIN_PASSWORD_SCORE,
} from "@/lib/password-security";
import { renderPasswordUpdatedEmail, sendEmail } from "@/lib/email";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const strength = getPasswordStrength(newPassword);
    if (strength.score < MIN_PASSWORD_SCORE) {
      return NextResponse.json({ error: "New password is too weak" }, { status: 400 });
    }
    const breached = await getPwnedPasswordCount(newPassword);
    if (breached > 0) {
      return NextResponse.json(
        { error: "New password appears in known data breaches. Choose another password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true, name: true },
    });
    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrent) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Password updated - The Hood",
        html: renderPasswordUpdatedEmail(user.name || "there"),
      }).catch((error) => console.error("Password update email error:", error));
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}

