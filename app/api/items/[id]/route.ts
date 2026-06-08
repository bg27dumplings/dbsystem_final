import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  type UpdateMarketplaceItemFieldErrors,
  updateMarketplaceItemDetails
} from "@/lib/marketplace/application/item-management-service";

type UpdateItemResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
  fieldErrors?: UpdateMarketplaceItemFieldErrors;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<UpdateItemResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const newImageFiles = formData.getAll("newImages").filter((value): value is File => value instanceof File && value.size > 0);
  const result = await updateMarketplaceItemDetails({
    itemId: id,
    studentId: session.studentId,
    title: String(formData.get("title") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    conditionLabel: String(formData.get("conditionLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    exchangeMode: String(formData.get("exchangeMode") ?? ""),
    exchangeValue: String(formData.get("exchangeValue") ?? ""),
    description: String(formData.get("description") ?? ""),
    keptImageIds: formData.getAll("keptImageIds").map(String),
    imageOrder: formData.getAll("imageOrder").map(String),
    newImageKeys: formData.getAll("newImageKeys").map(String),
    newImageFiles
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
    redirectTo: "/me/items?updated=1"
  });
}
