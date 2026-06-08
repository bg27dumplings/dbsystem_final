import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { createMarketplaceItem } from "@/lib/marketplace/application/item-creation-service";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";

type CreateItemResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateMarketplaceItemFieldErrors;
};

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<CreateItemResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const formData = await request.formData();
  const images = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);

  const result = await createMarketplaceItem({
    studentId: session.studentId,
    title: String(formData.get("title") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    conditionLabel: String(formData.get("conditionLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    exchangeMode: String(formData.get("exchangeMode") ?? ""),
    exchangeValue: String(formData.get("exchangeValue") ?? ""),
    description: String(formData.get("description") ?? ""),
    images
  });

  if (!result.ok) {
    return NextResponse.json<CreateItemResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<CreateItemResponse>({
    ok: true,
    redirectTo: "/me/items?created=1"
  });
}
