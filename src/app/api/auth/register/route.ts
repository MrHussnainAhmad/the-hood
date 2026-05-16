import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  getPasswordStrength,
  getPwnedPasswordCount,
  MIN_PASSWORD_LENGTH,
  MIN_PASSWORD_SCORE,
} from "@/lib/password-security";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { renderAccountCreatedEmail, renderVerifyEmailTemplate, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, providerEmployeeRange } = body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedRole = role === "PROVIDER" ? "PROVIDER" : "CONSUMER";
    const allowedRanges = new Set(["1", "2-5", "5-10", "10+"]);

    if (!normalizedEmail || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const strength = getPasswordStrength(password);
    if (strength.score < MIN_PASSWORD_SCORE) {
      return NextResponse.json(
        { error: "Password is too weak. Please use a stronger password." },
        { status: 400 }
      );
    }

    const breachedCount = await getPwnedPasswordCount(password);
    if (breachedCount > 0) {
      return NextResponse.json(
        {
          error: "This password has appeared in known data breaches. Please choose another one.",
          breachedCount,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRange =
      normalizedRole === "PROVIDER" && allowedRanges.has(providerEmployeeRange)
        ? providerEmployeeRange
        : normalizedRole === "PROVIDER"
        ? "1"
        : null;
    const isCompanyProvider = normalizedRole === "PROVIDER" && normalizedRange === "10+";

    // Create user (with backward-compat fallback for stale Prisma client)
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          phone,
          role: normalizedRole,
          providerEmployeeRange: normalizedRange,
          isProfessional: false,
          providerCvUrl: null,
          companyVerificationStatus: isCompanyProvider ? "PENDING_DOCUMENTS" : "NOT_REQUIRED",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          providerEmployeeRange: true,
          companyVerificationStatus: true,
        },
      });
    } catch (createError: unknown) {
      const message = createError instanceof Error ? createError.message : String(createError);
      if (!message.includes("Unknown argument `providerEmployeeRange`")) {
        throw createError;
      }
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          phone,
          role: normalizedRole,
          isProfessional: false,
          providerCvUrl: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    }

    const verificationToken = await createEmailVerificationToken(normalizedEmail);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

    await Promise.allSettled([
      sendEmail({
        to: normalizedEmail,
        subject: "Welcome to The Hood",
        html: renderAccountCreatedEmail(name),
      }),
      sendEmail({
        to: normalizedEmail,
        subject: "Verify your email - The Hood",
        html: renderVerifyEmailTemplate(name, verifyUrl),
      }),
    ]);

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
