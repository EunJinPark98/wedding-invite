import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InvitationView from "@/components/InvitationView";
import { getInvitation } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getInvitation(slug);
  if (!inv) return { title: "청첩장을 찾을 수 없습니다" };
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

  return (
    <main className="min-h-screen bg-gray-100">
      <InvitationView template={inv.template} data={inv.data} />
    </main>
  );
}
