import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { updateStudentBio } from "@/lib/marketplace/infrastructure/student-profile-repository";
import { revalidatePath } from "next/cache";

type ProfileResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: { bio?: string };
};

export async function PUT(request: Request) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const body = (await request.json()) as { bio?: string };
  const bio = (body.bio ?? "").trim();

  if (bio.length > 500) {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors: { bio: "簡介請控制在 500 字內。" }
    }, { status: 400 });
  }

  await updateStudentBio(session.studentId, bio);
  revalidatePath("/me/profile");
  revalidatePath("/me");

  return NextResponse.json<ProfileResponse>({ ok: true });
}
