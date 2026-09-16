import type { NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth-confirm";

export async function GET(request: NextRequest) {
  return confirmEmail(request);
}
