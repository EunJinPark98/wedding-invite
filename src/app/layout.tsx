import type { Metadata } from "next";
import {
  Nanum_Myeongjo,
  Noto_Sans_KR,
  Noto_Serif_KR,
  Gowun_Batang,
  Nanum_Brush_Script,
  Song_Myung,
  Nanum_Gothic,
  Gowun_Dodum,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

// 한글 폰트: subsets 미지정 + preload:false (한글 글리프 누락 방지)
const myeongjo = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
  variable: "--font-myeongjo",
});

const notoKr = Noto_Sans_KR({
  weight: ["300", "400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-noto",
});

const gowun = Gowun_Batang({
  weight: ["400", "700"],
  display: "swap",
  preload: false,
  variable: "--font-gowun",
});

// 붓글씨 (청첩장 인사말·타이틀 캘리그라피용)
const brush = Nanum_Brush_Script({
  weight: ["400"],
  display: "swap",
  preload: false,
  variable: "--font-brush",
});

const song = Song_Myung({
  weight: ["400"],
  display: "swap",
  variable: "--font-song",
});

// 본명조 — 실제 인쇄 청첩장에서 가장 널리 쓰이는 세리프
const serifKr = Noto_Serif_KR({
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-serifkr",
});

const nanumGothic = Nanum_Gothic({
  weight: ["400", "700", "800"],
  display: "swap",
  preload: false,
  variable: "--font-nanumgothic",
});

const dodum = Gowun_Dodum({
  weight: ["400"],
  display: "swap",
  preload: false,
  variable: "--font-dodum",
});

// 영문 장식용 (latin 전용)
const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
});

const DESCRIPTION =
  "별처럼 빛나는 순간, 마음을 담은 초대장으로. 결혼 청첩장부터 백일·돌잔치·칠순·팔순·생일 초대장까지, 템플릿을 고르고 내용을 입력해 나만의 모바일 초대장을 만들고 링크로 공유하세요. 결혼·육아·가족을 위한 웹서비스, 별마마파파.";

/**
 * 공유 카드(카톡·문자 미리보기)를 만들 때 쓰는 기준 주소.
 * 이미지 경로를 절대 주소로 바꾸는 데 필요하다 — 없으면 미리보기에 그림이 안 뜬다.
 * 주소가 바뀌면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 만 바꾸면 된다.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://starinvite.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "별빛 초대장 — 모바일 청첩장 · 백일 · 돌잔치 · 칠순 · 생일 초대장 만들기",
    template: "%s | 별빛 초대장",
  },
  description: DESCRIPTION,
  applicationName: "별빛 초대장",
  authors: [{ name: "별마마파파" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "별빛 초대장",
    url: "/",
    title: "별빛 초대장 — 마음을 담은 모바일 초대장 만들기",
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "별빛 초대장 — 결혼 · 백일 · 돌잔치 · 칠순 · 생일 모바일 초대장",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "별빛 초대장 — 마음을 담은 모바일 초대장 만들기",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${myeongjo.variable} ${notoKr.variable} ${serifKr.variable} ${gowun.variable} ${brush.variable} ${song.variable} ${nanumGothic.variable} ${dodum.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
