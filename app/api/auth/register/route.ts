import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createStudentSession } from "@/lib/auth/student-session";
import { createStudent, findStudentByEmail, findStudentByStudentNo } from "@/lib/auth/student-repository";
import { validateStudentIdFormat } from "@/lib/auth/student-auth";
import { getDbPool } from "@/lib/db";

type RegisterRequestBody = {
  name?: string;
  student_id?: string;
  email?: string;
  email_code?: string;
  password?: string;
  confirm_password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRequestBody;
  const name = body.name?.trim() ?? "";
  const studentId = body.student_id?.trim().toUpperCase() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const emailCode = body.email_code?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirm_password ?? "";
  const fieldErrors: Record<string, string> = {};

  if (!name) {
    fieldErrors.name = "請輸入姓名。";
  }

  if (!studentId) {
    fieldErrors.student_id = "請輸入學號。";
  } else if (!validateStudentIdFormat(studentId)) {
    fieldErrors.student_id = "學號格式不正確，需為 3 個英文字加 6 個數字，且中間 3 碼為民國入學年。";
  }

  if (!email) {
    fieldErrors.email = "請輸入校園信箱。";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "請輸入有效的電子郵件格式。";
  }

  if (!password) {
    fieldErrors.password = "請輸入密碼。";
  } else if (password.length < 8) {
    fieldErrors.password = "密碼至少需要 8 個字元。";
  }

  if (!emailCode) {
    fieldErrors.email_code = "請輸入信箱驗證碼。";
  }

  if (!confirmPassword) {
    fieldErrors.confirm_password = "請再次輸入密碼。";
  } else if (password !== confirmPassword) {
    fieldErrors.confirm_password = "兩次輸入的密碼不一致。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({
      ok: false,
      fieldErrors,
      formError: "請先修正欄位內容。"
    }, { status: 400 });
  }

  const [existingStudentNo, existingEmail] = await Promise.all([
    findStudentByStudentNo(studentId),
    findStudentByEmail(email)
  ]);

  if (existingStudentNo) {
    fieldErrors.student_id = "這個學號已經註冊過了。";
  }

  if (existingEmail) {
    fieldErrors.email = "這個信箱已經被使用。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({
      ok: false,
      fieldErrors,
      formError: "此帳號資料已存在，請改用其他學號或信箱。"
    }, { status: 409 });
  }

  // Verify email verification code
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
      formError: "註冊失敗，信箱驗證未通過。"
    }, { status: 400 });
  }

  // Delete verification code
  await pool.execute(
    `DELETE FROM email_verifications WHERE email = ?`,
    [email]
  );

  const passwordHash = await hash(password, 10);
  const student = await createStudent({
    studentNo: studentId,
    name,
    email,
    passwordHash
  });

  await createStudentSession(student);

  return NextResponse.json({
    ok: true,
    redirectTo: "/"
  });
}
