import "server-only";
import { randomInt } from "crypto";
import { cookies } from "next/headers";
import { STUDENT_CAPTCHA_COOKIE, STUDENT_CAPTCHA_TTL_SECONDS } from "@/lib/auth/constants";
import { signPayload, verifyPayload } from "@/lib/auth/signing";

type CaptchaPayload = {
  code: string;
  expiresAt: number;
};

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getSessionSecret() {
  return process.env.STUDENT_SESSION_SECRET || "dev-student-session-secret";
}

function generateCode(length = 5) {
  return Array.from({ length }, () => CAPTCHA_CHARS[randomInt(0, CAPTCHA_CHARS.length)]).join("");
}

export async function setCaptchaCookie(code = generateCode()) {
  const expiresAt = Date.now() + STUDENT_CAPTCHA_TTL_SECONDS * 1000;
  const cookieStore = await cookies();
  const payload: CaptchaPayload = { code, expiresAt };

  cookieStore.set(STUDENT_CAPTCHA_COOKIE, signPayload(payload, getSessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_CAPTCHA_TTL_SECONDS
  });

  return code;
}

export function renderCaptchaSvg(code: string) {
  const wobble = Array.from(code).map((char, index) => {
    const rotate = index % 2 === 0 ? -9 : 8;
    const y = 38 + (index % 2 === 0 ? -3 : 3);
    return `<text x="${26 + index * 30}" y="${y}" transform="rotate(${rotate}, ${26 + index * 30}, ${y})">${char}</text>`;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80" role="img" aria-label="captcha">
      <rect width="220" height="80" rx="16" fill="#f8f1d6" />
      <path d="M10 58 C45 25, 70 70, 110 34 S175 16, 210 48" stroke="#2f5a4f" stroke-width="3" fill="none" opacity="0.35" />
      <path d="M15 25 C48 65, 95 8, 150 44 S195 70, 210 25" stroke="#c08a33" stroke-width="2" fill="none" opacity="0.35" />
      <g fill="#10231f" font-family="monospace" font-size="28" font-weight="700">
        ${wobble}
      </g>
    </svg>
  `.trim();
}

export async function verifyCaptcha(input: string) {
  const cookieStore = await cookies();
  const payload = verifyPayload<CaptchaPayload>(cookieStore.get(STUDENT_CAPTCHA_COOKIE)?.value, getSessionSecret());

  if (!payload || payload.expiresAt < Date.now()) {
    return false;
  }

  return payload.code === input.trim().toUpperCase();
}

export async function clearCaptchaCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_CAPTCHA_COOKIE);
}
