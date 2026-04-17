import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PROVIDER" || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      providerEmployeeRange: true,
      companyVerificationStatus: true,
      companyVerificationReviewNote: true,
      companyName: true,
      companyRegistrationNumber: true,
      companyTaxId: true,
      companyAddress: true,
      companyContactName: true,
      companyContactPhone: true,
      companyVerificationFiles: true,
    },
  });

  return NextResponse.json(provider);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PROVIDER" || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    companyName,
    companyRegistrationNumber,
    companyTaxId,
    companyAddress,
    companyContactName,
    companyContactPhone,
    files,
  } = await request.json();

  if (
    !companyName?.trim() ||
    !companyRegistrationNumber?.trim() ||
    !companyTaxId?.trim() ||
    !companyAddress?.trim() ||
    !companyContactName?.trim() ||
    !companyContactPhone?.trim()
  ) {
    return NextResponse.json({ error: "Please fill all required company fields" }, { status: 400 });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "At least one verification file is required" }, { status: 400 });
  }

  const provider = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerEmployeeRange: true, companyVerificationStatus: true },
  });

  if (!provider || provider.providerEmployeeRange !== "10+") {
    return NextResponse.json(
      { error: "Verification is required only for company providers" },
      { status: 400 }
    );
  }
  if (
    provider.companyVerificationStatus === "SUBMITTED" ||
    provider.companyVerificationStatus === "VERIFIED"
  ) {
    return NextResponse.json(
      { error: "You cannot submit verification again at this stage" },
      { status: 400 }
    );
  }

  const uploadedFiles = Array.isArray(files)
    ? files.filter(
        (f: unknown): f is string =>
          typeof f === "string" && /^https?:\/\//i.test(f)
      )
    : [];

  if (uploadedFiles.length === 0) {
    return NextResponse.json(
      { error: "Please upload verification files first" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      companyName: companyName.trim(),
      companyRegistrationNumber: companyRegistrationNumber.trim(),
      companyTaxId: companyTaxId.trim(),
      companyAddress: companyAddress.trim(),
      companyContactName: companyContactName.trim(),
      companyContactPhone: companyContactPhone.trim(),
      companyVerificationFiles: uploadedFiles,
      companyVerificationStatus: "SUBMITTED",
      companyVerificationReviewNote: null,
    },
    select: {
      providerEmployeeRange: true,
      companyVerificationStatus: true,
      companyVerificationReviewNote: true,
      companyName: true,
      companyRegistrationNumber: true,
      companyTaxId: true,
      companyAddress: true,
      companyContactName: true,
      companyContactPhone: true,
      companyVerificationFiles: true,
    },
  });

  return NextResponse.json(updated);
}
