import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isDemoEnabled } from "@/lib/prototype.mjs";

export const dynamic = "force-dynamic";
const COOKIE = "ferready-selection";

async function proxy(request: NextRequest) {
  if (isDemoEnabled(process.env.FERREADY_DEMO)) return new NextResponse(null, { status: 404 });
  // Browser mutations must originate on this storefront. Cookies never leave server code.
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Origin not allowed" }, { status: 403 });
  }
  const jar = await cookies();
  const stored = jar.get(COOKIE)?.value;
  const token = stored && /^[a-f0-9]{64}$/.test(stored) ? stored : randomBytes(32).toString("hex");
  try {
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && body.length > 512) return new NextResponse(null, { status: 413 });
    const response = await fetch(`${process.env.MEDUSA_BACKEND_URL ?? "http://127.0.0.1:9000"}/selection-cart`, {
      method: request.method,
      headers: { "Content-Type": "application/json", "x-selection-token": token },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const result = NextResponse.json(await response.json(), {
      status: response.status, headers: { "Cache-Control": "no-store" },
    });
    if (response.ok && token !== stored) result.cookies.set(COOKIE, token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 30,
    });
    return result;
  } catch {
    return NextResponse.json({ message: "No pudimos conectar con el carrito. Intenta de nuevo." }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
