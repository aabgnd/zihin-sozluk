import { redirect } from "next/navigation";

// Yönetim paneli /yonetim adresine taşındı.
export default function AdminRedirect() {
  redirect("/yonetim");
}
