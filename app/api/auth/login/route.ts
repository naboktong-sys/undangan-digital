import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    await createSession();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "Username atau password salah" }, { status: 401 });
}