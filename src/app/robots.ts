import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

/**
 * 검색 로봇 안내.
 *
 * 만들어진 초대장(/v/*)은 여기서 막지 않는다. 카카오톡·문자 미리보기를 만드는
 * 수집기가 이 파일을 보고 물러서면 공유 카드가 통째로 비기 때문이다.
 * 대신 초대장 화면 자체에 "검색에 담지 말 것" 표시를 붙인다
 * (src/app/v/[slug]/page.tsx 의 robots).
 *
 * 로그인해야 볼 수 있는 화면은 어차피 로봇이 못 읽지만, 굳이 두드리지 않도록
 * 여기서 함께 알려 준다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/editor", "/my", "/pej", "/login", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
