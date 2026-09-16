import type { NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth-confirm";

// Eski mailler ve şifre sıfırlama bağlantıları bu adrese gelir; aynı işi yapar.
export async function GET(request: NextRequest) {
  return confirmEmail(request);
}
