import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getStudentSession, createStudentSession } from "@/lib/auth/student-session";
import { findStudentById, updateStudent, findStudentByEmail } from "@/lib/auth/student-repository";

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ ok: false, formError: "請先登入。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";
    const fieldErrors: Record<string, string> = {};

    if (!name) {
      fieldErrors.name = "請輸入姓名。";
    }

    if (!email) {
      fieldErrors.email = "請輸入電子信箱。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.email = "請輸入有效的電子信箱格式。";
    }

    if (password) {
      if (password.length < 8) {
        fieldErrors.password = "密碼至少需要 8 個字元。";
      }
      if (password !== confirmPassword) {
        fieldErrors.confirmPassword = "兩次輸入的密碼不一致。";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ ok: false, fieldErrors, formError: "請先修正欄位內容。" }, { status: 400 });
    }

    const student = await findStudentById(session.studentId);
    if (!student) {
      return NextResponse.json({ ok: false, formError: "找不到帳號資料。" }, { status: 404 });
    }

    // Check if email is used by another student
    if (email !== student.email) {
      const emailDup = await findStudentByEmail(email);
      if (emailDup) {
        return NextResponse.json({ ok: false, fieldErrors: { email: "此信箱已被其他帳號使用。" }, formError: "請更換信箱。" }, { status: 409 });
      }
    }

    let passwordHash: string | undefined = undefined;
    if (password) {
      passwordHash = await hash(password, 10);
    }

    await updateStudent(session.studentId, name, email, passwordHash);

    // Refresh student session with updated name
    await createStudentSession({
      studentId: student.studentId,
      studentNo: student.studentNo,
      name,
      status: student.status as any
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ ok: false, formError: "伺服器錯誤，修改失敗。" }, { status: 500 });
  }
}
