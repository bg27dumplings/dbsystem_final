import { NextResponse } from "next/server";
import { authenticateStudent, validateStudentIdFormat } from "@/lib/auth/student-auth";
import { clearCaptchaCookie, verifyCaptcha } from "@/lib/auth/captcha";
import { createStudentSession } from "@/lib/auth/student-session";

type LoginRequestBody = {
  student_id?: string;
  password?: string;
  captcha?: string;
  returnTo?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequestBody;
  const studentId = body.student_id?.trim() ?? "";
  const password = body.password ?? "";
  const captcha = body.captcha?.trim() ?? "";
  const fieldErrors: Record<string, string> = {};

  if (!studentId) {
    fieldErrors.student_id = "請輸入學號。";
  } else if (!validateStudentIdFormat(studentId)) {
    fieldErrors.student_id = "學號格式不正確，需為 3 個英文字加 6 個數字，且中間 3 碼為民國入學年。";
  }

  if (!password) {
    fieldErrors.password = "請輸入密碼。";
  }

  if (!captcha) {
    fieldErrors.captcha = "請輸入驗證碼。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ ok: false, fieldErrors, formError: "請先修正欄位內容。" }, { status: 400 });
  }

  const isCaptchaValid = await verifyCaptcha(captcha);
  if (!isCaptchaValid) {
    await clearCaptchaCookie();
    return NextResponse.json({
      ok: false,
      fieldErrors: { captcha: "驗證碼錯誤或已過期，請重新輸入。" },
      formError: "登入失敗，請重新確認驗證碼。"
    }, { status: 400 });
  }

  const result = await authenticateStudent(studentId, password);
  if (!result.ok) {
    await clearCaptchaCookie();

    if (result.reason === "frozen") {
      return NextResponse.json({
        ok: false,
        formError: "此帳號目前已被凍結，無法登入與上架。若有疑問，請透過帳號協助入口聯繫管理方。"
      }, { status: 403 });
    }

    if (result.reason === "deleted") {
      return NextResponse.json({
        ok: false,
        formError: "此帳號已被停用，無法登入。若有疑問，請聯繫管理方。"
      }, { status: 403 });
    }

    return NextResponse.json({
      ok: false,
      formError: "學號或密碼錯誤。"
    }, { status: 401 });
  }

  await createStudentSession(result.student);
  await clearCaptchaCookie();

  return NextResponse.json({
    ok: true,
    redirectTo: "/"
  });
}
