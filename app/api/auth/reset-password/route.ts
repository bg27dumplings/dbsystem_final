import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getDbPool } from "@/lib/db";
import { findStudentByEmail } from "@/lib/auth/student-repository";

type ResetPasswordBody = {
  email?: string;
  email_code?: string;
  new_password?: string;
  confirm_password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const emailCode = body.email_code?.trim() ?? "";
    const newPassword = body.new_password ?? "";
    const confirmPassword = body.confirm_password ?? "";
    const fieldErrors: Record<string, string> = {};

    if (!email) {
      fieldErrors.email = "請輸入信箱。";
    }

    if (!emailCode) {
      fieldErrors.email_code = "請輸入驗證碼。";
    }

    if (!newPassword) {
      fieldErrors.new_password = "請輸入新密碼。";
    } else if (newPassword.length < 8) {
      fieldErrors.new_password = "密碼至少需要 8 個字元。";
    }

    if (!confirmPassword) {
      fieldErrors.confirm_password = "請再次輸入密碼。";
    } else if (newPassword !== confirmPassword) {
      fieldErrors.confirm_password = "兩次輸入的密碼不一致。";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ ok: false, fieldErrors, formError: "請先修正欄位內容。" }, { status: 400 });
    }

    // Check if student exists
    const student = await findStudentByEmail(email);
    if (!student) {
      return NextResponse.json({
        ok: false,
        fieldErrors: { email: "此信箱尚未註冊為會員。" },
        formError: "重設失敗，找不到此帳號。"
      }, { status: 404 });
    }

    // Verify verification code
    const pool = getDbPool();
    const [verifications] = await pool.execute<any[]>(
      `SELECT code, expires_at FROM email_verifications WHERE email = ?`,
      [email]
    );

    const verification = verifications[0];
    if (!verification || verification.code !== emailCode || new Date(verification.expires_at).getTime() < Date.now()) {
      return NextResponse.json({
        ok: false,
        fieldErrors: { email_code: "驗證碼不正確或已過期。" },
        formError: "驗證失敗，請確認驗證碼。"
      }, { status: 400 });
    }

    // Update password
    const passwordHash = await hash(newPassword, 10);
    await pool.execute(
      `UPDATE students SET password_hash = ? WHERE email = ?`,
      [passwordHash, email]
    );

    // Delete verification record
    await pool.execute(
      `DELETE FROM email_verifications WHERE email = ?`,
      [email]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json({ ok: false, formError: "系統忙碌中，請稍後再試。" }, { status: 500 });
  }
}
