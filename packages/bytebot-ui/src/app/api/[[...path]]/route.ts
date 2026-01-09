import { NextRequest } from "next/server";

/* -------------------------------------------------------------------- */
/* generic proxy helper                                                 */
/* -------------------------------------------------------------------- */
async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  // Support both BYTEBOT_AGENT_BASE_URL and NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL
  const BASE_URL = process.env.BYTEBOT_AGENT_BASE_URL || process.env.NEXT_PUBLIC_BYTEBOT_AGENT_BASE_URL;
  if (!BASE_URL) {
    throw new Error("BYTEBOT_AGENT_BASE_URL not configured");
  }
  const subPath = path.length ? path.join("/") : "";
  const url = `${BASE_URL}/${subPath}${req.nextUrl.search}`;

  // Extract cookies from the incoming request
  const cookies = req.headers.get("cookie");

  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(cookies && { Cookie: cookies }),
    },
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  };

  const res = await fetch(url, init);
  const body = await res.text();

  // Extract Set-Cookie headers from the backend response
  const setCookieHeaders = res.headers.getSetCookie?.() || [];

  // Create response headers
  const responseHeaders = new Headers({
    "Content-Type": "application/json",
  });

  // Add Set-Cookie headers if they exist
  setCookieHeaders.forEach((cookie) => {
    responseHeaders.append("Set-Cookie", cookie);
  });

  return new Response(body, {
    status: res.status,
    headers: responseHeaders,
  });
}

/* -------------------------------------------------------------------- */
/* route handlers                                                       */
/* -------------------------------------------------------------------- */
type PathParams = Promise<{ path?: string[] }>; // <- Promise is the key

async function handler(req: NextRequest, { params }: { params: PathParams }) {
  // During static export, return a simple response since backend runs separately
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    return new Response(JSON.stringify({ message: 'API proxy not available during static export' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { path } = await params;
  return proxy(req, path ?? []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
