import LegalLayout, {
  Clause,
  List,
  Section,
  Table,
} from "@/components/LegalLayout";
import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  KAKAO_CHANNEL_URL,
  OPERATOR_NAME,
  SERVICE_NAME,
} from "@/lib/legal";
import { MAX_GALLERY } from "@/lib/types";

export const metadata = {
  title: "개인정보처리방침",
  description: `${SERVICE_NAME}이 어떤 정보를 받아 어떻게 쓰고 언제 지우는지 안내합니다.`,
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침">
      <p className="text-sm leading-7 text-gray-600">
        {OPERATOR_NAME}(이하 &ldquo;운영자&rdquo;)는 {SERVICE_NAME}(이하
        &ldquo;서비스&rdquo;)를 제공하면서 이용자의 개인정보를 소중히 다루며,
        「개인정보 보호법」 등 관계 법령을 지킵니다. 이 방침은 서비스가 어떤
        정보를 받아 무엇에 쓰고 언제 지우는지를 알려 드리기 위한 것입니다.
      </p>

      <Section n={1} title="수집하는 개인정보 항목과 수집 방법">
        <Clause n={1}>
          서비스는 별도의 회원가입 절차 없이 카카오 · 네이버 소셜 로그인으로만
          가입할 수 있으며, 이때 이용자가 동의한 항목만 받습니다.
        </Clause>
        <Table
          head={["구분", "항목", "수집 방법"]}
          rows={[
            [
              "로그인 정보",
              "회원이름, 닉네임, 이메일 주소, 로그인 서비스가 부여한 회원 고유 식별자",
              "카카오 · 네이버 로그인 시 이용자 동의로 제공받음",
            ],
            [
              "초대장 내용",
              "이용자가 초대장에 직접 입력한 이름 · 소개 문구 · 연락처 · 행사 일시와 장소 · 인사말 · 예금주와 계좌번호, 이용자가 올린 사진",
              "이용자가 직접 입력 · 업로드",
            ],
            [
              "자동 생성 정보",
              "로그인 상태 유지를 위한 세션 쿠키",
              "서비스 이용 과정에서 자동 생성",
            ],
          ]}
        />
        <Clause n={2}>
          서비스는 주민등록번호를 비롯한 고유식별정보와 「개인정보 보호법」이
          정한 민감정보를 수집하지 않습니다.
        </Clause>
        <Clause n={3}>
          초대장에 다른 사람(가족 · 혼주 등)의 이름 · 연락처 · 계좌번호 · 사진을
          넣는 경우, 그 정보는 이용자가 직접 입력하는 것입니다. 이용자는 해당
          당사자의 동의를 받은 뒤 입력해야 합니다.
        </Clause>
      </Section>

      <Section n={2} title="개인정보의 이용 목적">
        <List
          items={[
            "회원 식별과 로그인 상태 유지",
            "이용자가 만든 초대장의 저장 · 조회 · 수정 · 삭제",
            "초대장 링크를 받은 사람에게 초대장 내용을 보여 주는 것",
            "종류별 제작 개수 제한 등 서비스 운영에 필요한 확인",
            "문의에 대한 답변",
          ]}
        />
        <p>
          서비스는 위 목적을 벗어나 개인정보를 이용하지 않으며, 광고 전송이나
          이용자 분석을 위한 별도의 추적 도구를 두고 있지 않습니다.
        </p>
      </Section>

      <Section n={3} title="보유 기간과 파기">
        <Clause n={1}>
          <strong className="text-gray-700">초대장과 업로드한 사진</strong>은
          행사일 당일까지 열람할 수 있고, 행사 다음 날(한국시간 0시)에 사진까지
          자동으로 완전히 삭제됩니다.
        </Clause>
        <Clause n={2}>
          이용자는 마이페이지에서 언제든지 초대장을 수정하거나 삭제할 수
          있습니다. 삭제하면 초대장에 담긴 내용과 사진이 즉시 함께 지워집니다.
        </Clause>
        <Clause n={3}>
          <strong className="text-gray-700">로그인 정보</strong>는 회원 자격을
          유지하는 동안 보관하며, 이용자가 탈퇴를 요청하면 지체 없이
          파기합니다. 탈퇴 요청 방법은 제7조에 있습니다.
        </Clause>
        <Clause n={4}>
          로그인 세션은 마지막 로그인으로부터 24시간이 지나면 자동으로
          만료되어, 다시 로그인해야 합니다.
        </Clause>
        <Clause n={5}>
          전자적 파일 형태로 저장된 개인정보는 복구할 수 없는 방법으로 지웁니다.
        </Clause>
      </Section>

      <Section n={4} title="제3자 제공">
        <p>
          서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에
          따라 수사기관 등이 적법한 절차로 요구하는 경우에는 예외로 합니다.
        </p>
        <p>
          이용자가 만든 초대장은 <strong className="text-gray-700">링크를
          아는 사람이면 누구나</strong> 볼 수 있습니다. 이는 초대장을 하객에게
          전하기 위한 서비스의 본래 기능이며, 링크 공유 범위는 이용자가 스스로
          정합니다.
        </p>
      </Section>

      <Section n={5} title="처리 위탁과 국외 이전">
        <Clause n={1}>
          서비스는 안정적인 운영을 위해 아래와 같이 개인정보 처리를 위탁하고
          있으며, 수탁자의 서버가 국외에 있어 개인정보가 국외로 이전됩니다.
        </Clause>
        <Table
          head={["수탁자", "위탁 업무", "이전 국가 · 시점 · 방법"]}
          rows={[
            [
              "Supabase, Inc.",
              "회원 정보 · 초대장 내용 · 업로드 사진의 저장과 관리, 로그인 인증",
              "미국 / 서비스 이용 시점에 네트워크를 통해 전송",
            ],
            [
              "Vercel, Inc.",
              "서비스 화면 제공(호스팅)",
              "미국 / 서비스 이용 시점에 네트워크를 통해 전송",
            ],
          ]}
        />
        <Clause n={2}>
          이전되는 항목은 제1조에 적은 로그인 정보와 초대장 내용이며, 보유
          기간은 제3조와 같습니다. 이용자는 국외 이전을 거부할 수 있으나, 거부
          시 서비스를 이용할 수 없습니다.
        </Clause>
        <Clause n={3}>
          그 밖에 아래 기능은 화면을 그리는 과정에서 해당 사업자의 서버에
          연결되며, 이때 이용자의 접속 정보가 해당 사업자에게 전달될 수
          있습니다. 서비스가 이 사업자들에게 회원 정보를 넘기지는 않습니다.
        </Clause>
        <List
          items={[
            "Google — 초대장의 약도 표시(지도)",
            "카카오 — 주소 검색, 카카오톡 공유하기",
            "카카오 · 네이버 — 소셜 로그인",
          ]}
        />
      </Section>

      <Section n={6} title="쿠키">
        <p>
          서비스는 로그인 상태를 유지하기 위한 쿠키만 사용합니다. 이 쿠키는
          브라우저를 닫으면 사라지며, 광고나 이용 행태 분석에는 쓰이지
          않습니다. 이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으나,
          그 경우 로그인이 필요한 기능을 이용할 수 없습니다.
        </p>
      </Section>

      <Section n={7} title="이용자의 권리와 행사 방법">
        <Clause n={1}>
          이용자는 언제든지 자신의 개인정보에 대한 열람 · 정정 · 삭제 · 처리
          정지를 요구할 수 있습니다.
        </Clause>
        <Clause n={2}>
          로그인해서 받아온 정보(회원이름 · 닉네임 · 이메일)는{" "}
          <strong className="text-gray-700">마이페이지 &gt; 내 계정</strong>
          에서 확인할 수 있고, 초대장 내용과 사진은 마이페이지에서 직접 수정 ·
          삭제할 수 있습니다.
        </Clause>
        <Clause n={3}>
          회원 탈퇴와 계정 정보 삭제는 아래 문의 창구로 요청해 주시면 본인
          확인 후 지체 없이 처리해 드립니다.
        </Clause>
      </Section>

      <Section n={8} title="안전성 확보 조치">
        <List
          items={[
            "이용자는 로그인한 본인이 만든 초대장에만 접근 · 수정 · 삭제할 수 있습니다.",
            "개인정보는 전송 구간 전체에서 암호화(HTTPS)되어 오갑니다.",
            "행사가 끝난 초대장은 자동으로 삭제해, 필요 이상으로 보관하지 않습니다.",
            "업로드 파일은 이미지 형식과 크기를 확인한 뒤에만 저장합니다.",
          ]}
        />
      </Section>

      <Section n={9} title="개인정보 보호책임자와 문의">
        <p>
          개인정보 처리에 관한 문의 · 불만 · 피해 구제는 아래로 연락해 주시면
          지체 없이 답변해 드리겠습니다.
        </p>
        <List
          items={[
            <>
              개인정보 보호책임자: {OPERATOR_NAME} 운영자
            </>,
            <>
              카카오톡 문의:{" "}
              <a
                href={KAKAO_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-600 underline underline-offset-2"
              >
                {SERVICE_NAME} 채널
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
        <p>
          개인정보 침해로 도움이 필요하시면 아래 기관에도 문의하실 수 있습니다.
        </p>
        <List
          items={[
            "개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)",
            "개인정보침해신고센터 (privacy.kisa.or.kr / 118)",
            "대검찰청 사이버수사과 (spo.go.kr / 1301)",
            "경찰청 사이버수사국 (ecrm.police.go.kr / 182)",
          ]}
        />
      </Section>

      <Section n={10} title="방침의 변경">
        <p>
          이 방침을 바꿀 때에는 변경 내용과 시행일을 이 페이지에 미리
          알리겠습니다. 다만 이용자의 권리에 중요한 변경이 있는 경우에는 시행일
          7일 전부터 알립니다.
        </p>
      </Section>

      <p className="mt-9 text-xs text-gray-400">
        {SERVICE_NAME}은 무료로 제공되며, 갤러리 사진은 초대장 한 개당{" "}
        {MAX_GALLERY}장까지 담을 수 있습니다.
      </p>
    </LegalLayout>
  );
}
