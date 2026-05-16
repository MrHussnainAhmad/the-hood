import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    const { name, phone, oldPassword, newPassword, confirmPassword } = body;

    const wantsPasswordUpdate =
      typeof oldPassword === "string" ||
      typeof newPassword === "string" ||
      typeof confirmPassword === "string";

    const userForPassword = wantsPasswordUpdate
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, password: true, email: true, name: true },
        })
      : null;

    if (wantsPasswordUpdate) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "Old password, new password and confirm password are required" },
          { status: 400 }
        );
      }
      if (!userForPassword?.password) {
        return NextResponse.json({ error: "Current password record not found" }, { status: 400 });
      }
      const validCurrent = await bcrypt.compare(oldPassword, userForPassword.password);
      if (!validCurrent) {
        return NextResponse.json({ error: "Old password is incorrect" }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
          { status: 400 }
        );
      }
      if (getPasswordStrength(newPassword).score < MIN_PASSWORD_SCORE) {
        return NextResponse.json({ error: "Password is too weak" }, { status: 400 });
      }
      if ((await getPwnedPasswordCount(newPassword)) > 0) {
        return NextResponse.json(
          { error: "This password has appeared in known data breaches. Please choose another one." },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        ...(wantsPasswordUpdate
          ? { password: await bcrypt.hash(newPassword, 10) }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (wantsPasswordUpdate && user.email) {
      await sendEmail({
        to: user.email,
        subject: "Password updated - The Hood",
        html: renderPasswordUpdatedEmail(user.name || "there"),
      }).catch((error) => console.error("Profile password update email error:", error));
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
