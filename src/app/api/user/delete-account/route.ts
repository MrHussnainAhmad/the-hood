import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderAccountDeletedEmail, sendEmail } from "@/lib/email";

function deletedEmailForUser(id: string) {
  return `deleted+${id}@thehood.local`;
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "ADMIN") {
      return NextResponse.json({ error: "Admin account cannot be deleted here" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, email: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "PROVIDER") {
      await prisma.service.updateMany({
        where: { providerId: user.id },
        data: { active: false },
      });
      await prisma.providerLocation.updateMany({
        where: { providerId: user.id },
        data: { active: false },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: "Deleted User",
        email: deletedEmailForUser(user.id),
        phone: null,
        address: null,
        image: null,
        password: null,
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: "Account self-deleted",
      },
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Account deleted - The Hood",
        html: renderAccountDeletedEmail(user.name || "there"),
      }).catch((error) => console.error("Self delete account email error:", error));
    }

    return NextResponse.json({ message: "Account deleted" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

