import Link from "next/link";
import LegalLayout, { Clause, List, Section } from "@/components/LegalLayout";
import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  KAKAO_CHANNEL_URL,
  OPERATOR_NAME,
  SERVICE_NAME,
} from "@/lib/legal";
import { MAX_GALLERY } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export const metadata = {
  title: "이용약관",
  description: `${SERVICE_NAME} 서비스 이용에 관한 약관입니다.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="이용약관">
      <Section n={1} title="목적">
        <p>
          이 약관은 {OPERATOR_NAME}(이하 &ldquo;운영자&rdquo;)가 제공하는{" "}
          {SERVICE_NAME}(이하 &ldquo;서비스&rdquo;)를 이용하는 데 필요한 사항을
          정하는 것을 목적으로 합니다.
        </p>
      </Section>

      <Section n={2} title="정의">
        <List
          items={[
            <>
              <strong className="text-gray-700">이용자</strong>란 서비스에
              접속하여 이 약관에 따라 서비스를 이용하는 사람을 말합니다.
            </>,
            <>
              <strong className="text-gray-700">회원</strong>이란 카카오 ·
              네이버 계정으로 로그인하여 초대장을 만들 수 있는 이용자를
              말합니다.
            </>,
            <>
              <strong className="text-gray-700">초대장</strong>이란 회원이
              서비스에서 만들어 링크로 공유하는 모바일 초대장을 말합니다.
            </>,
            <>
              <strong className="text-gray-700">하객</strong>이란 회원이 공유한
              링크로 초대장을 열어 보는 사람을 말합니다.
            </>,
          ]}
        />
      </Section>

      <Section n={3} title="약관의 효력과 변경">
        <Clause n={1}>
          이 약관은 서비스 화면에 게시함으로써 효력이 생깁니다.
        </Clause>
        <Clause n={2}>
          운영자는 필요한 경우 관계 법령을 어기지 않는 범위에서 약관을 바꿀 수
          있으며, 바뀐 약관은 시행일과 함께 이 페이지에 게시합니다. 이용자에게
          불리한 변경은 시행일 7일 전부터 알립니다.
        </Clause>
      </Section>

      <Section n={4} title="회원 가입과 계정">
        <Clause n={1}>
          서비스는 별도의 가입 절차 없이 카카오 · 네이버 로그인으로 이용할 수
          있습니다. 로그인하면 이 약관에 동의한 것으로 봅니다.
        </Clause>
        <Clause n={2}>
          회원은 자신의 계정을 다른 사람이 쓰게 해서는 안 되며, 계정 관리
          소홀로 생긴 문제에 대한 책임은 회원에게 있습니다.
        </Clause>
        <Clause n={3}>
          로그인 후 24시간이 지나면 보안을 위해 자동으로 로그아웃되며, 다시
          로그인하면 그대로 이어서 쓸 수 있습니다.
        </Clause>
      </Section>

      <Section n={5} title="서비스의 내용">
        <Clause n={1}>
          서비스는 결혼 · 백일 · 돌잔치 · 칠순 · 팔순 · 생일 초대장을 만들어
          링크로 공유하는 기능을 <strong className="text-gray-700">무료로</strong>{" "}
          제공합니다.
        </Clause>
        <Clause n={2}>
          한 회원은 초대장 종류마다 1개씩, 최대 {CATEGORIES.length}개까지 만들 수
          있습니다. 게시가 끝난 초대장은 자리를 비워 주어 새로 만들 수 있습니다.
        </Clause>
        <Clause n={3}>
          갤러리 사진은 초대장 한 개당 {MAX_GALLERY}장까지 담을 수 있습니다. 이는
          초대장이 빠르게 열리도록 정한 기술적 한도입니다.
        </Clause>
        <Clause n={4}>
          운영자는 서비스의 내용을 개선하기 위해 기능 · 디자인 · 한도를 바꿀 수
          있으며, 이용자의 권리에 중요한 변경이 있는 경우 미리 알립니다.
        </Clause>
      </Section>

      <Section n={6} title="게시 기간과 자동 삭제">
        <Clause n={1}>
          초대장은{" "}
          <strong className="text-gray-700">
            행사일 당일까지 열람할 수 있고, 행사 다음 날(한국시간 0시)에 담긴
            내용과 사진이 완전히 삭제됩니다.
          </strong>{" "}
          삭제된 초대장은 되살릴 수 없습니다.
        </Clause>
        <Clause n={2}>
          회원은 마이페이지에서 언제든지 초대장을 수정하거나 삭제할 수
          있습니다. 삭제하면 올린 사진도 함께 지워집니다.
        </Clause>
        <Clause n={3}>
          회원은 필요한 자료를 미리 따로 보관해 두시기 바랍니다. 운영자는 자동
          삭제된 자료를 복구해 드릴 수 없습니다.
        </Clause>
      </Section>

      <Section n={7} title="이용자의 의무">
        <Clause n={1}>
          회원은 초대장에 넣는 내용에 대해 스스로 책임집니다. 특히 다음 사항을
          지켜 주셔야 합니다.
        </Clause>
        <List
          items={[
            "다른 사람의 이름 · 연락처 · 계좌번호 · 사진을 넣을 때에는 그 당사자의 동의를 미리 받을 것",
            "저작권이 있는 사진을 권리자의 허락 없이 올리지 않을 것",
            "다른 사람의 명예를 훼손하거나 불쾌감을 주는 내용을 넣지 않을 것",
            "법령을 어기거나 공서양속에 반하는 목적으로 서비스를 쓰지 않을 것",
          ]}
        />
        <Clause n={2}>
          회원은 초대장 링크를 누구에게 공유할지 스스로 정합니다. 링크를 아는
          사람은 로그인 없이 초대장을 볼 수 있으므로, 공유 범위에 유의해
          주십시오.
        </Clause>
      </Section>

      <Section n={8} title="금지 행위">
        <List
          items={[
            "서비스를 자동화된 방법으로 대량 이용하거나, 정상적인 운영을 방해하는 행위",
            "다른 회원의 초대장에 무단으로 접근하거나 고치려는 행위",
            "서비스를 복제 · 판매 · 재배포하거나 이를 이용해 영리 목적의 대행 서비스를 운영하는 행위",
            "악성 프로그램을 올리거나 서버에 부담을 주는 행위",
          ]}
        />
        <p>
          위 행위가 확인되면 운영자는 사전 통지 없이 해당 초대장을 비공개
          처리하거나 이용을 제한할 수 있습니다.
        </p>
      </Section>

      <Section n={9} title="서비스의 중단">
        <Clause n={1}>
          운영자는 설비 점검 · 교체, 통신 두절, 천재지변 등 부득이한 사유가 있는
          경우 서비스 제공을 일시적으로 멈출 수 있습니다.
        </Clause>
        <Clause n={2}>
          운영자가 서비스를 완전히 종료하는 경우, 최소 30일 전에 서비스 화면에
          알립니다.
        </Clause>
      </Section>

      <Section n={10} title="책임의 한계">
        <Clause n={1}>
          서비스는 무료로 제공되며, 운영자는 천재지변 · 통신 장애 등 운영자의
          잘못이 아닌 사유로 생긴 손해에 대해 책임을 지지 않습니다.
        </Clause>
        <Clause n={2}>
          운영자는 회원이 초대장에 넣은 내용의 정확성 · 적법성에 대해 책임지지
          않으며, 그로 인해 제3자와 분쟁이 생긴 경우 회원이 자신의 책임과
          비용으로 해결합니다.
        </Clause>
        <Clause n={3}>
          지도 · 주소 검색 · 카카오톡 공유처럼 외부 사업자가 제공하는 기능은 그
          사업자의 사정에 따라 달라질 수 있습니다.
        </Clause>
      </Section>

      <Section n={11} title="개인정보의 보호">
        <p>
          운영자는 이용자의 개인정보를 관계 법령에 따라 보호하며, 자세한 내용은{" "}
          <Link
            href="/privacy"
            className="text-gold-600 underline underline-offset-2"
          >
            개인정보처리방침
          </Link>
          에서 확인하실 수 있습니다.
        </p>
      </Section>

      <Section n={12} title="문의와 준거법">
        <Clause n={1}>
          서비스에 관한 문의는 아래로 보내 주시면 답변해 드리겠습니다.
        </Clause>
        <List
          items={[
            <>
              카카오톡 문의:{" "}
              <a
                href={KAKAO_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-600 underline underline-offset-2"
              >
                {OPERATOR_NAME} 채널
              </a>
            </>,
            <>
              인스타그램:{" "}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-600 underline underline-offset-2"
              >
                @byeolmamapapa
              </a>
            </>,
            ...(CONTACT_EMAIL
              ? [
                  <>
                    이메일:{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-gold-600 underline underline-offset-2"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </>,
                ]
              : []),
          ]}
        />
        <Clause n={2}>
          이 약관은 대한민국 법에 따르며, 서비스 이용과 관련하여 분쟁이 생긴
          경우 민사소송법이 정한 관할 법원에 소를 제기합니다.
        </Clause>
      </Section>
    </LegalLayout>
  );
}
