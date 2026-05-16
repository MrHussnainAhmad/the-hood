import { createHash } from "crypto";
import zxcvbn from "zxcvbn";

export const MIN_PASSWORD_LENGTH = 10;
export const MIN_PASSWORD_SCORE = 3;

export function getPasswordStrength(password: string) {
  return zxcvbn(password || "");
}

export async function getPwnedPasswordCount(password: string): Promise<number> {
  if (!password) return 0;

  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      "Add-Padding": "true",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to verify password against breach database");
  }

  const body = await response.text();
  const lines = body.split("\n");

  for (const line of lines) {
    const [hashSuffix, countText] = line.trim().split(":");
    if (hashSuffix === suffix) {
      const count = Number.parseInt(countText, 10);
      return Number.isFinite(count) ? count : 0;
    }
  }

  return 0;
}
