import type { NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth-confirm";

/**
 * Şifre yenileme bağlantısının indiği adres.
 *
 * Tür ve hedef adresten okunmaz, burada sabittir. Böylece mail şablonundaki
 * "&" karakterleri kaçışlansa ve type/next parametreleri okunamaz hale gelse
 * bile bağlantı doğru çalışır: token_hash ilk parametre olduğu için her
 * durumda sağlam gelir.
 */
export async function GET(request: NextRequest) {
  return confirmEmail(request, {
    zorunluTip: "recovery",
    zorunluHedef: "/sifre-yenile",
  });
}
