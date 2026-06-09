import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { updateMarketplaceItem } from "@/lib/marketplace/application/item-update-service";
import type { CreateMarketplaceItemFieldErrors } from "@/lib/marketplace/domain/create-item";

type UpdateItemResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: CreateMarketplaceItemFieldErrors;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<UpdateItemResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const images = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);

  const result = await updateMarketplaceItem({
    itemId: id,
    studentId: session.studentId,
    title: String(formData.get("title") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    conditionLabel: String(formData.get("conditionLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    quantity: String(formData.get("quantity") ?? "1"),
    locationX: String(formData.get("locationX") ?? ""),
    locationY: String(formData.get("locationY") ?? ""),
    exchangeMode: String(formData.get("exchangeMode") ?? ""),
    exchangeValue: String(formData.get("exchangeValue") ?? ""),
    description: String(formData.get("description") ?? ""),
    images
  });

  if (!result.ok) {
    return NextResponse.json<UpdateItemResponse>({
      ok: false,
      formError: result.formError,
      fieldErrors: result.fieldErrors
    }, { status: 400 });
  }

  return NextResponse.json<UpdateItemResponse>({
    ok: true,
    redirectTo: `/me/items?updated=1`
  });
}
