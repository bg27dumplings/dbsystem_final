import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { changeMarketplaceItemStatus } from "@/lib/marketplace/application/item-management-service";

type ChangeStatusResponse = {
  ok: boolean;
  redirectTo?: string;
  formError?: string;
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getStudentSession();
  if (!session || session.status !== "active") {
    return NextResponse.json<ChangeStatusResponse>({
      ok: false,
      formError: "請先登入有效的學生帳號。"
    }, { status: 401 });
  }

  const { id } = await params;
  const result = await changeMarketplaceItemStatus({
    itemId: id,
    studentId: session.studentId,
    action: "reactivate"
  });

  if (!result.ok) {
    return NextResponse.json<ChangeStatusResponse>({
      ok: false,
      formError: result.formError
    }, { status: 400 });
  }

  return NextResponse.json<ChangeStatusResponse>({
    ok: true,
    redirectTo: "/me/items?reactivated=1"
  });
}
