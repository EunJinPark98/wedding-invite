import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InvitationView from "@/components/InvitationView";
import { getInvitation, isExpired } from "@/lib/store";
import { labelsOf } from "@/lib/categories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) return { title: "초대장을 찾을 수 없습니다" };
  if (isExpired(inv)) return { title: "게시 기간이 종료된 초대장입니다" };
  const { groomName, brideName, weddingDate, venueName } = inv.data;
  const labels = labelsOf(inv.data);
  const title = labels.showPerson2
    ? `${groomName} ♥ ${brideName} 결혼합니다`
    : `${groomName}의 ${labels.countdownLabel}에 초대합니다`;
  // 카톡 미리보기 카드에 예식일·장소까지 보이도록
  const when = [weddingDate, venueName].filter(Boolean).join(" · ");
  const description =
    when ||
    (labels.showPerson2
      ? `${groomName}님과 ${brideName}님의 결혼식에 초대합니다.`
      : `${groomName}님의 ${labels.countdownLabel}에 초대합니다.`);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
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

  // 행사가 끝난 초대장은 배포 중단
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
            이 초대장은 행사가 끝나
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
