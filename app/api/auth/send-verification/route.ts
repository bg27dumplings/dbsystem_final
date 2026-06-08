import { NextResponse } from "next/server";
import { generateVerificationCode, saveVerificationCode, sendVerificationEmail } from "@/lib/auth/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ ok: false, formError: "請輸入有效的電子信箱。" }, { status: 400 });
    }

    const code = generateVerificationCode();
    await saveVerificationCode(trimmedEmail, code);
    const result = await sendVerificationEmail(trimmedEmail, code);

    if (!result.ok) {
      return NextResponse.json({ ok: false, formError: result.error ?? "驗證信寄送失敗，請稍後再試。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return NextResponse.json({ ok: false, formError: "系統忙碌中，請稍後再試。" }, { status: 500 });
  }
}
