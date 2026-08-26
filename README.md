# KSNVE 2026 추계 학술대회 앱

한국소음진동공학회 학술대회의 프로그램·초록·발표장 정보를 제공하는 모바일 웹앱입니다.
Next.js App Router 기반의 정적 사이트이며 백엔드가 없습니다.

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 프로덕션 빌드
npm run typecheck
npm run validate:data   # 데이터 무결성 검사
npm run test:mock-time  # 대시보드 시간 로직 테스트
```

## 화면 구성

하단 탭 4개로 구성됩니다.

| 경로 | 화면 | 내용 |
|---|---|---|
| `/` | 프로그램 | 카운트다운/진행 상황, 주요 일정, 공지 요약, 날짜별 전체 일정 |
| `/papers` | 논문 | 발표 유형·날짜 필터, 세션별 접이식 목록 |
| `/my` | 내 일정 | 저장한 논문·세션, 시간 충돌 경고, `.ics` 내보내기 |
| `/more` | 더보기 | 공지, 행사개요, 등록안내, 배치도, 후원사, 앱 정보, 발표장 |

검색(`/search`)은 헤더의 돋보기로 진입합니다. 상세 화면은 `/papers/[id]`,
`/sessions/[id]`, `/speakers/[id]`, `/venues/[id]` 입니다.

## 데이터

모든 콘텐츠는 `data/`의 JSON입니다. **코드에는 일정 정보가 없습니다** — 추계 실데이터로
교체할 때 아래 파일만 바꾸면 됩니다.

| 파일 | 내용 |
|---|---|
| `sessions.json` | 논문 발표 세션 |
| `official-events.json` | 개회식·키노트·만찬·포스터·대토론회 등 공식 일정 |
| `papers-with-abstracts.json` | 논문 248건 (앱의 주 데이터) |
| `poster-papers.json` | 포스터 논문 71건 |
| `papers.json` | 프로그램북 원본 메타데이터 (추출 파이프라인 전용, 수정하지 않음) |
| `speakers.json` | 발표자 색인 |
| `venues.json` | 발표장 |
| `announcements.json` | 공지 (구글 시트 연결 실패 시 폴백) |
| `conference-info.json` | 행사개요·등록안내 본문 |
| `sponsors.json` | 후원·전시 참여사 |

대회 메타데이터(명칭, 기간, 장소)는 `lib/conference-config.ts`에 있습니다.

### 실데이터 교체 절차

1. `data/`의 JSON을 교체하고 `lib/conference-config.ts`의 날짜·명칭을 갱신
2. `npm run validate:data` — 세션 참조, 날짜 범위, 장소 매핑, 발표자 색인을 검사
3. `npm run build`

`validate:data`는 오류가 있으면 비정상 종료하므로 배포 전 게이트로 쓸 수 있습니다.

## 공지사항 (구글 시트)

재배포 없이 공지를 수정할 수 있도록, 게시된 구글 시트의 CSV를 런타임에 읽습니다.

1. 시트를 만들고 첫 행에 `id, category, title, body, date` 헤더를 넣습니다(한글 헤더도 인식).
2. 파일 → 공유 → 웹에 게시 → CSV 형식으로 게시
3. 발급된 URL을 환경변수로 지정합니다.

```
NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL=https://docs.google.com/spreadsheets/d/e/…/pub?gid=0&single=true&output=csv
```

설정하지 않으면 `data/announcements.json`이 사용됩니다. 시트를 읽지 못하면 마지막으로
성공한 내용이 브라우저에 캐시되어 표시됩니다.

## 오프라인

`public/sw.js`가 앱 셸·정적 자산·이미지를 캐시합니다. 학술대회장 네트워크가 포화되어도
한 번 열어 본 프로그램과 초록은 계속 열립니다. 서비스워커는 프로덕션 빌드에서만
등록됩니다.

## 논문 PDF

추계 학술대회에서는 논문별 PDF가 제공됩니다. `papers-with-abstracts.json`의 각 논문에
`paperPdf` 값을 넣으면 논문 상세 화면에 원문 PDF 버튼이 나타납니다.

## 폰트

Pretendard를 앱이 실제로 쓰는 문자만 남겨 서브셋(2MB → 456KB)하고 self-host 합니다.
데이터를 교체한 뒤에는 `npm run build:font`로 다시 생성하세요.

## 저장되는 개인 데이터

내 일정, 읽은 공지, 최근 검색은 브라우저 `localStorage`에만 저장되며 서버로 전송되지
않습니다. 백엔드가 없으므로 기기 간 동기화는 되지 않습니다.
