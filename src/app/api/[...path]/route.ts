import { NextRequest, NextResponse } from "next/server";

const backendURL = process.env.BACKEND_URL;

async function handler(request: NextRequest) {
  if (!backendURL) {
    return NextResponse.json({ message: "Backend Url not configured" }, { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const path = incomingUrl.pathname.replace(/^\/api/, "");
  const targetUrl = `${backendURL.replace(/\/+$/, "")}${path}${incomingUrl.search}`;

  const headers = new Headers();
  for (const name of ["content-type", "cookie", "accept", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? `${error.message}: ${String(error.cause)}` : String(error) },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const POST = handler;