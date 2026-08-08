import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/legal";

/**
 * 검색에 알릴 주소.
 *
 * 만들어진 초대장은 넣지 않는다 — 남의 청첩장이 검색에 뜨면 안 된다.
 * 누구나 열어 봐도 되는 화면만 담는다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3 },
  ];
}
