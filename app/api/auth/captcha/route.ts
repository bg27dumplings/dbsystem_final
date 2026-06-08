import { NextResponse } from "next/server";
import { renderCaptchaSvg, setCaptchaCookie } from "@/lib/auth/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const code = await setCaptchaCookie();
  const svg = renderCaptchaSvg(code);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
