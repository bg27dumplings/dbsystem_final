import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { updateStudentProfile } from "@/lib/marketplace/infrastructure/student-profile-repository";
import { storeMarketplaceImage } from "@/lib/marketplace/infrastructure/item-storage";
import { revalidatePath } from "next/cache";

type ProfileResponse = {
  ok: boolean;
  formError?: string;
  fieldErrors?: { name?: string; email?: string; bio?: string };
};

export async function PUT(request: Request) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  let name: string;
  let email: string;
  let bio: string;
  let avatarUrl: string | null = null;

  try {
    const formData = await request.formData();
    name = (formData.get("name") as string) ?? "";
    email = (formData.get("email") as string) ?? "";
    bio = (formData.get("bio") as string) ?? "";
    avatarUrl = formData.get("avatarUrl") as string | null;
    const avatarFile = formData.get("avatarFile") as File | null;

    if (avatarFile && avatarFile.size > 0 && avatarFile.type.startsWith("image/")) {
      const storedImage = await storeMarketplaceImage(avatarFile);
      avatarUrl = storedImage.publicUrl;
    }
  } catch (error) {
    return NextResponse.json({ error: "無效的請求格式" }, { status: 400 });
  }

  if (!name.trim()) {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors: { name: "姓名不可為空。" }
    }, { status: 400 });
  }
  
  if (!email.trim() || !email.includes("@")) {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors: { email: "請輸入有效的信箱格式。" }
    }, { status: 400 });
  }

  if (bio.trim().length > 500) {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors: { bio: "簡介請控制在 500 字內。" }
    }, { status: 400 });
  }

  const result = await updateStudentProfile(session.studentId, name.trim(), email.trim(), bio.trim(), avatarUrl ?? null);
  
  if (!result.ok) {
    if (result.error === "email_taken") {
      return NextResponse.json<ProfileResponse>({
        ok: false,
        formError: "儲存失敗",
        fieldErrors: { email: "此信箱已被使用。" }
      }, { status: 400 });
    }
    return NextResponse.json<ProfileResponse>({ ok: false, formError: "發生未知錯誤。" }, { status: 500 });
  }

  revalidatePath("/me/profile");
  revalidatePath("/me");

  return NextResponse.json<ProfileResponse>({ ok: true });
}
