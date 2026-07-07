import { Suspense } from "react";
import LoginClient from "@/components/LoginClient";

export const metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center text-gray-400">불러오는 중...</div>}
    >
      <LoginClient />
    </Suspense>
  );
}
