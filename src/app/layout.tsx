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

export const metadata: Metadata = {
  title: {
    default: "별빛 초대장 — 모바일 청첩장 만들기",
    template: "%s | 별빛 초대장",
  },
  description:
    "우리의 별처럼 빛나는 시작, 가장 우리다운 청첩장으로. 템플릿을 고르고 내용을 입력해 나만의 모바일 청첩장을 만들고 링크로 공유하세요. 결혼·육아·가족을 위한 웹서비스, 별마마파파.",
  applicationName: "별빛 초대장",
  authors: [{ name: "별마마파파" }],
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
