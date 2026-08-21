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
  Dancing_Script,
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

// 인트로 문구용 흘림체 (latin 전용) — 굵게 쓸 수 있어 크게 띄워도 힘이 산다.
// 한글은 이 서체에 없어서 붓글씨(--font-brush)로 넘어간다 (globals.css 참고)
const dancing = Dancing_Script({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dancing",
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

// 공유 카드(카톡·문자 미리보기)에 뜨는 제목과 설명 — 검색용 문구와 따로 둔다
const SHARE_TITLE = "별빛 초대장 - 나만의 초대장 만들기";
const SHARE_DESCRIPTION =
  "결혼식·백일·돌잔치·칠순·팔순·생일 초대장을 직접 만드는 무료 서비스";

/**
 * 공유 카드(카톡·문자 미리보기)를 만들 때 쓰는 기준 주소.
 * 이미지 경로를 절대 주소로 바꾸는 데 필요하다 — 없으면 미리보기에 그림이 안 뜬다.
 * 주소가 바뀌면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 만 바꾸면 된다.
 */
import { OPERATOR_NAME, OPERATOR_URL, INSTAGRAM_URL, SITE_URL } from "@/lib/legal";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "별빛 초대장 — 모바일 청첩장 · 백일 · 돌잔치 · 칠순 · 생일 초대장 만들기",
    template: "%s | 별빛 초대장",
  },
  description: DESCRIPTION,
  applicationName: "별빛 초대장",
  authors: [{ name: "별마마파파" }],
  // 도메인을 옮긴 뒤에도 검색에는 이 주소만 대표로 남도록 명시한다.
  // (예전 주소도 그대로 열리지만 canonical 은 항상 새 주소를 가리킨다)
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "별빛 초대장",
    url: "/",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [
      {
        url: "/og-v2.png",
        width: 1200,
        height: 630,
        alt: "별빛 초대장 — 결혼 · 백일 · 돌잔치 · 칠순 · 팔순 · 생일 모바일 초대장",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: ["/og-v2.png"],
  },
};

// 검색엔진이 서비스를 "이름 있는 것"으로 인식하도록 알려 주는 구조화 데이터.
// 무료라는 점(offers)과 운영자(publisher)까지 함께 밝힌다.
// (script 태그는 </script> 를 만나면 그 자리서 끊기므로 "/" 는 이스케이프해 넣는다)
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "별빛 초대장",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  publisher: {
    "@type": "Organization",
    name: OPERATOR_NAME,
    url: OPERATOR_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [INSTAGRAM_URL],
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
      className={`${myeongjo.variable} ${notoKr.variable} ${serifKr.variable} ${gowun.variable} ${brush.variable} ${song.variable} ${nanumGothic.variable} ${dodum.variable} ${cormorant.variable} ${dancing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
