import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Luma Route OS"',
    },
  });
}

export function middleware(request: NextRequest) {
  const configuredUser = process.env.CRM_BASIC_AUTH_USER;
  const configuredPassword = process.env.CRM_BASIC_AUTH_PASSWORD;

  if (!configuredUser || !configuredPassword) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");

  if (!header?.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const [user, ...passwordParts] = decoded.split(":");
    const password = passwordParts.join(":");

    if (user === configuredUser && password === configuredPassword) {
      return NextResponse.next();
    }
  } catch {
    return unauthorized();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
