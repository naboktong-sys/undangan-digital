import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "admin_session";

function sign(value: string) {
  const hmac = crypto.createHmac("sha256", process.env.SESSION_SECRET!);
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

function verify(signed: string) {
  const [value, sig] = signed.split(".");
  if (!value || !sig) return null;
  const expected = sign(value).split(".")[1];
  return sig === expected ? value : null;
}

export async function createSession() {
  const value = `admin-${Date.now()}`;
  const signed = sign(value);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const signed = cookieStore.get(SESSION_COOKIE)?.value;
  if (!signed) return null;
  return verify(signed);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}