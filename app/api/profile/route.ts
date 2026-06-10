import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { updateStudentProfile } from "@/lib/marketplace/infrastructure/student-profile-repository";
import { storeMarketplaceImage } from "@/lib/marketplace/infrastructure/item-storage";
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

  let bio: string;
  let avatarUrl: string | null = null;

  try {
    const formData = await request.formData();
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

  if (bio.trim().length > 500) {
    return NextResponse.json<ProfileResponse>({
      ok: false,
      formError: "請先修正欄位內容。",
      fieldErrors: { bio: "簡介請控制在 500 字內。" }
    }, { status: 400 });
  }

  await updateStudentProfile(session.studentId, bio.trim(), avatarUrl ?? null);
  revalidatePath("/me/profile");
  revalidatePath("/me");

  return NextResponse.json<ProfileResponse>({ ok: true });
}
