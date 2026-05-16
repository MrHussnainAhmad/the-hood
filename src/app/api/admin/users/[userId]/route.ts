import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderAccountDeletedEmail, sendEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      role,
      isBanned,
      bannedReason,
      companyVerificationStatus,
      companyVerificationReviewNote,
    } = body;

    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: "You cannot modify your own admin account here" },
        { status: 400 }
      );
    }

    if (
      companyVerificationStatus === "REJECTED" &&
      (!companyVerificationReviewNote || !String(companyVerificationReviewNote).trim())
    ) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name,
        phone,
        role,
        isBanned,
        bannedReason: isBanned ? bannedReason || "Policy violation" : null,
        bannedAt: isBanned ? new Date() : null,
        companyVerificationStatus,
        companyVerificationReviewNote:
          companyVerificationStatus === "REJECTED"
            ? String(companyVerificationReviewNote).trim()
            : companyVerificationStatus === "VERIFIED"
            ? "Verified by admin"
            : companyVerificationReviewNote,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        providerEmployeeRange: true,
        companyVerificationStatus: true,
        companyVerificationReviewNote: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true },
    });

    await prisma.user.delete({
      where: { id: params.userId },
    });

    if (targetUser?.email) {
      await sendEmail({
        to: targetUser.email,
        subject: "Account deleted - The Hood",
        html: renderAccountDeletedEmail(targetUser.name || "there"),
      }).catch((error) => console.error("Account delete email error:", error));
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
