'use client';

import { useEffect, useState } from 'react';

/** Programme book pp. 27–30. Award counts are still open, so they read "추후 공지". */
const TABS = [
  { id: 'chair', label: '좌장' },
  { id: 'oral', label: '구두발표' },
  { id: 'poster', label: '포스터' },
  { id: 'award', label: '시상' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const OFFLINE = '본 학술대회는 오프라인 발표를 원칙으로 합니다. (단, 조직위원회 검토 후 일부 동영상 발표가 허용될 수 있음)';

function TalkTimes() {
  return (
    <div className="fee-table-wrap">
      <table className="fee-table">
        <thead><tr><th scope="col">구분</th><th scope="col">배정 시간</th></tr></thead>
        <tbody>
          <tr><th scope="row">일반 논문</th><td>15분 (발표 12분 + 질의응답 3분)</td></tr>
          <tr><th scope="row">유망과학자</th><td>25분</td></tr>
          <tr><th scope="row">키노트 강연</th><td>30분</td></tr>
          <tr><th scope="row">현장사례</th><td>10분</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function Chair() {
  return (
    <>
      <ol className="info-list">
        <li>프로그램북의 <b>좌장별 시간표</b>를 참조하여 담당 세션의 시간과 발표장을 미리 확인하신 후, 세션 시작 전 발표장에 입장하여 모든 <b>발표자의 출석</b>을 확인하고 발표 진행에 이상이 없는지 확인하여 주십시오.</li>
        <li><b>세션 내 참가자는 발표 내용에 대한 동영상 촬영 또는 녹화, 사진 촬영은 원칙적으로 불가함을 안내하여 주십시오.</b></li>
        <li>각 논문은 <b>12분 발표, 3분 질의응답으로 편당 총 15분</b>이 배정되어 있습니다(아래 표). 이에 맞추어 사회를 진행하여 주십시오. 모든 세션에서는 국어 또는 영어로 발표할 수 있으며, 발표자가 영어로 발표하는 경우에는 사회도 영어로 진행하여 주시기 바랍니다.</li>
        <li>조직위원회에서는 후속세대 양성 등을 목적으로 일반 및 학생 참가자를 대상으로 (최)우수논문을 선정하여 시상하고자 합니다. <b>우수논문 발표자를 선정</b>할 수 있도록, 행사 당일 좌장석에 비치된 평가서에 따라 발표논문을 평가하여 주십시오.</li>
        <li>세션이 종료된 후에는 <b>학술대회 등록처</b>에 &lsquo;우수논문 평가서&rsquo;를 제출한 후 소정의 <b>좌장 수당</b>을 꼭 수령하시기 바랍니다.</li>
      </ol>
      <TalkTimes />
      <p className="guide-callout">{OFFLINE}</p>
      <p className="guide-callout">현장에서 참가자가 개별적으로 발표영상 녹화 또는 사진 촬영을 희망하는 경우, 반드시 발표자의 동의가 필요합니다.</p>
    </>
  );
}

function Oral() {
  return (
    <>
      <ol className="info-list">
        <li>모든 구두발표자는 프로그램의 <b>발표자별 시간표</b>를 참조하여 본인의 발표 시간과 발표 세션(세션장)을 미리 확인하여 발표에 참가해 주시기 바랍니다. 앱의 통합검색에서 이름으로도 찾을 수 있습니다.</li>
        <li>한 편의 구두발표에 할당된 시간은 <b>질의응답(3분) 포함 15분</b>이므로, 좌장의 지시에 따라 질의응답 시간을 제외한 <b>발표시간 12분 안에 발표를 마치셔야</b> 합니다. 유망과학자·키노트·현장사례는 아래 표를 참고하십시오.</li>
        <li><b>[발표 당일]</b> 해당 세션 시작 전 발표장에 도착하여 담당 좌장에게 출석을 알린 후, 각 발표장에 설치된 노트북에 자료를 저장하여 발표 준비를 완료하시기 바랍니다. 발표 자료는 <b>USB 메모리카드</b>에 저장하여 준비해 주십시오.</li>
        <li><b>[시상]</b> 우수 연구 성과에 대한 학술 발표 장려 목적으로 조직위원회에서는 (최)우수논문 발표자(일반부문과 학생부문으로 구분, 인원 추후 공지)를 선정하여 시상하고 있습니다. 발표 과정이나 내용, 발표 자료(PPT) 등이 평가에 반영되므로 평가 항목을 참고하여 발표하여 주시기 바랍니다(시상 탭 참고).</li>
      </ol>
      <TalkTimes />
      <p className="guide-callout">{OFFLINE}</p>
      <p className="guide-callout">발표자는 발표에 앞서 원활한 진행을 위해 세션의 좌장께 출석 여부를 꼭 알려 주시기 바랍니다.</p>
      <p className="info-note">※ 학생 발표인 경우 지도교수의 현장 참가를 적극 권장합니다.</p>
    </>
  );
}

function Poster() {
  return (
    <>
      <ol className="info-list">
        <li>포스터 발표자는 각자의 논문번호를 프로그램의 발표시간표 또는 세션별 논문제목에서 확인한 후, 해당 포스터 판넬에 <b>발표 시간 10분 전까지 포스터를 부착</b>하여 발표 준비를 완료하여 주십시오.</li>
      </ol>
      <div className="fee-table-wrap">
        <table className="fee-table">
          <thead><tr><th scope="col">포스터 번호</th><th scope="col">발표시간 (발표자 대기시간)</th></tr></thead>
          <tbody>
            <tr><th scope="row">P101~P148</th><td>11월 26일(목) 11:40~12:20 (40분)</td></tr>
            <tr><th scope="row">P201~P242</th><td>11월 27일(금) 10:00~10:40 (40분)</td></tr>
          </tbody>
        </table>
      </div>
      <p className="info-note">발표장: 컨퍼런스홀 (1층, 소음진동 제품전시장). 포스터 발표물은 발표 후에도 계속 게시 바랍니다. 행사 종료 후 학회 본부에서 일괄 철수할 예정입니다.</p>

      <h2 className="info-subhead">포스터 발표물 준비 및 게시</h2>
      <ul className="info-list">
        <li>포스터는 준비된 판넬의 <b>정해진 규격(90×120cm)</b>에 맞게 준비하고, 내용(폰트, 형식 등)은 자유롭게 작성하시면 됩니다.</li>
        <li>포스터는 발표 당일 배정된 논문번호별 위치에 부착하여 주십시오. 부착에 필요한 문구류(테이프 또는 압핀)는 조직위원회에서 제공합니다.</li>
      </ul>
      <figure className="guide-figure">
        <img src="/images/poster-panel.webp" width={480} height={907} alt="포스터 판넬 규격: 판넬 95×238cm, 발표물 90×120cm 이내. 부득이한 경우 아래 여백이 있는 하단까지 부착 가능" loading="lazy" />
        <figcaption>포스터 판넬 규격 (발표물 90×120cm 이내)</figcaption>
      </figure>

      <h2 className="info-subhead">발표자 유의사항</h2>
      <ul className="info-list">
        <li>포스터 발표시간에는 저자 중 적어도 한 명이 본인의 포스터 판넬 앞에서 대기하여야 하며, 참여자의 질문에 답변할 수 있어야 합니다.</li>
        <li>포스터 게시물은 개별 발표시간이 지난 후에도 일반 참가자분들이 발표 내용을 확인할 수 있도록 일정 시간 게시 후 학회 본부에서 일괄 철수·폐기하니(별도로 보관하지 않습니다), 개별 수거는 하지 않으셔도 됩니다. 단, 필요한 경우 해당 발표시간 종료 후 개별 수거 가능합니다.</li>
        <li><b>[시상] 학생 발표자</b>는 수상자 선정을 위한 평가가 진행될 예정이며, 심사에 응할 수 있도록 <b>&lsquo;3분 이내의 스피치&rsquo;</b>를 준비하여야 합니다. 포스터 발표 시간 내 부재 또는 3분 스피치에 참여하지 않은 경우 수상 후보에서 제외될 수 있습니다.</li>
      </ul>
    </>
  );
}

function Award() {
  return (
    <>
      <h2 className="info-subhead">(최)우수논문상</h2>
      <p className="guide-text">우수 연구 성과에 대한 학술 발표 장려 목적으로 본 학술대회에서 우수 논문을 발표한 발표자(일반부문과 학생부문으로 구분, 인원 추후 공지)를 선정하여 시상할 예정입니다.</p>
      <ul className="info-list">
        <li>일반: 발표유형 ORAL 발표로 학계, 연구계, 산업계 대상</li>
        <li>학생: 발표유형 ORAL, POSTER 발표 대상 (학부생은 POSTER 발표만 해당)</li>
      </ul>

      <h2 className="info-subhead">케이티엠테크놀로지 학생우수논문상</h2>
      <p className="guide-text">KTM테크놀로지(주)의 후원에 힘입어 후속세대 양성 등을 목적으로 학술대회 논문 발표 참가 학생을 대상으로 &lsquo;우수한 논문&rsquo;을 선정하여 학생우수논문상을 시상하고 있습니다. 학생 발표자 여러분의 많은 참여 바랍니다.</p>

      <h2 className="info-subhead">선정 방법</h2>
      <div className="info-cards">
        <article>
          <b>구두발표 (인원 추후 공지)</b>
          <p>좌장(1차) 및 조직위원회(2차) 평가</p>
          <p>평가 항목: 연구 동기, 목적, 방법, 결과, 결론, 기여(독창성), 발표시간 준수, 발표태도, 청중에 대한 배려(뒤에서도 잘 들릴 수 있도록 발표), 발표자료의 시각적/청각적 효과</p>
        </article>
        <article>
          <b>포스터발표 (인원 추후 공지)</b>
          <p>행사 당일 좌장 또는 조직위원회 평가</p>
          <p>평가 항목: 연구 내용, 포스터 자료, 3분 스피치</p>
          <p>평가 조건: 학생 포스터 발표자는 심사에 응할 수 있도록 &lsquo;3분 이내의 스피치&rsquo;를 준비해야 하며, 포스터 발표 시간 내 부재 또는 3분 스피치에 참여하지 않을 경우 수상 후보에서 제외될 수 있습니다.</p>
        </article>
      </div>
      <p className="info-note">※ 시상: 차기 학술대회 또는 행사 종료 후 2개월 이내 개별 시상</p>
      <p className="guide-callout">우수논문 평가를 위해, 대회 조직위원회에서는 필요한 경우 행사 종료 후 발표자료(PPT) 제출을 요청할 수 있습니다.</p>

      <h2 className="info-subhead">우수사례 시상 — 현장사례 세션</h2>
      <p className="guide-text">산업현장 연구자들의 우수 연구/개발 사례에 대한 보급 및 연구 활동 장려를 위해 &lsquo;현장사례&rsquo; 세션을 통해 우수 사례를 선정하여 시상(인원 추후 공지)하고 있습니다. 시상식은 해당 학술대회 기간 중 수여 예정입니다.</p>
      <ul className="info-list">
        <li>평가 항목: 연구 동기 및 목적, 방법, 결과, 결론, 기여 부분, 활용 가치</li>
      </ul>
    </>
  );
}

const PANELS: Record<TabId, () => React.ReactElement> = { chair: Chair, oral: Oral, poster: Poster, award: Award };

const isTab = (value: string): value is TabId => TABS.some((tab) => tab.id === value);

/** Tabbed guide; the hash (#chair, #oral, #poster, #award) picks the tab so session pages can link straight to one. */
export default function PresentationGuide() {
  const [tab, setTab] = useState<TabId>('chair');

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (isTab(hash)) setTab(hash);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const choose = (id: TabId) => {
    setTab(id);
    window.history.replaceState(window.history.state, '', `#${id}`);
  };

  const Panel = PANELS[tab];
  return (
    <>
      <div className="date-strip guide-tabs" role="tablist" aria-label="참가요령 구분">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => choose(item.id)}>
            <b>{item.label}</b>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="guide-panel"><Panel /></div>
    </>
  );
}
