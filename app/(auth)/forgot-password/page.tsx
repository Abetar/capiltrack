// app/(auth)/reset-password/page.tsx

import ResetPasswordClient from "./ResetPasswordClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}