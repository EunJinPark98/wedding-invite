import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InvitationView from "@/components/InvitationView";
import { getInvitation, isExpired } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) return { title: "청첩장을 찾을 수 없습니다" };
  if (isExpired(inv)) return { title: "게시 기간이 종료된 청첩장입니다" };
  const { groomName, brideName } = inv.data;
  return {
    title: `${groomName} ♥ ${brideName} 결혼합니다`,
    description: `${groomName}님과 ${brideName}님의 결혼식에 초대합니다.`,
    openGraph: {
      title: `${groomName} ♥ ${brideName} 결혼합니다`,
      description: inv.data.greetingTitle,
      images: inv.data.mainPhotoUrl ? [inv.data.mainPhotoUrl] : [],
    },
  };
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) notFound();

  // 운영 기간이 지난 청첩장은 배포 중단
  if (isExpired(inv)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm rounded-3xl border border-gold-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-2xl">
            💐
          </div>
          <h1 className="text-lg font-semibold text-gray-800">
            게시 기간이 종료됐어요
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            이 청첩장은 설정된 운영 기간이 지나
            <br />더 이상 공개되지 않습니다.
            <br />
            찾아주셔서 감사합니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <InvitationView template={inv.template} data={inv.data} />
    </main>
  );
}
