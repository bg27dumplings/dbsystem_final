import { NextResponse } from "next/server";
import { suggestListing } from "@/lib/ai/ollama-service";
import { getStudentSession } from "@/lib/auth/student-session";

export async function POST(request: Request) {
  try {
    const session = await getStudentSession();
    if (!session || session.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageBase64, hints } = await request.json();

    if (!imageBase64 && !hints) {
      return NextResponse.json(
        { error: "請提供圖片或文字提示" },
        { status: 400 }
      );
    }

    const result = await suggestListing(imageBase64, hints);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return NextResponse.json(
      { error: "AI 服務暫時無法使用，請稍後再試。" },
      { status: 500 }
    );
  }
}
