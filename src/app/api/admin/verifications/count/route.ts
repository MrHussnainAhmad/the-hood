import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN" || session.user.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.user.count({
      where: {
        role: "PROVIDER",
        providerEmployeeRange: "10+",
        companyVerificationStatus: "SUBMITTED",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Verification count fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification count" },
      { status: 500 }
    );
  }
}

