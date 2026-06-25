import { Suspense } from "react";
import EditorClient from "@/components/EditorClient";

export const metadata = { title: "청첩장 만들기" };

export default function EditorPage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center text-gray-400">불러오는 중...</div>}
    >
      <EditorClient />
    </Suspense>
  );
}
