import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const EMAIL_VERIFY_PREFIX = "email-verify:";
const PASSWORD_RESET_PREFIX = "password-reset:";

export async function createEmailVerificationToken(email: string) {
  const identifier = `${EMAIL_VERIFY_PREFIX}${email}`;
  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

export async function consumeEmailVerificationToken(token: string) {
  const existing = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existing) return null;
  if (existing.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => null);
    return null;
  }

  await prisma.verificationToken.delete({
    where: { token },
  });

  if (!existing.identifier.startsWith(EMAIL_VERIFY_PREFIX)) return null;
  return existing.identifier.replace(EMAIL_VERIFY_PREFIX, "");
}

export async function createPasswordResetToken(email: string) {
  const identifier = `${PASSWORD_RESET_PREFIX}${email}`;
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const existing = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existing) return null;
  if (existing.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => null);
    return null;
  }
  if (!existing.identifier.startsWith(PASSWORD_RESET_PREFIX)) return null;

  await prisma.verificationToken.delete({
    where: { token },
  });

  return existing.identifier.replace(PASSWORD_RESET_PREFIX, "");
}
