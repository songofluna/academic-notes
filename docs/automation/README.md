# Section 번호로 학습 노트 제작하기

이 시스템은 저장소를 연 AI 에이전트와 검증 CLI를 함께 사용한다. 원본 필기 PDF·강의안과 Section별 페이지를 한 번 등록하면 이후에는 **“5.10절 작성”**처럼 요청할 수 있다. 에이전트가 원본을 읽고 본문·그림·필요한 인터랙티브를 작성하며, CLI가 출처 연결, 파일 보존, 검수 기록과 통합을 검사한다. CLI는 LLM을 호출하지 않으며 API 키, 백그라운드 작업, 유료 모델 사용을 새로 설정하지 않는다.

저장소 루트의 `AGENTS.md`가 [집필 스킬](../../.agents/skills/academic-note-author/SKILL.md)을 안내한다. 저장소를 열지 않은 새 대화에서는 저장소 URL과 이 스킬 경로를 함께 알려준다. 전역 개인 스킬 설치는 필요하지 않다.

## 처음 한 번: 원본 등록

Node.js 18 이상이면 웹 빌드·검증은 의존성 설치 없이 실행된다. PDF 추출에는 Poppler의 `pdfinfo`, `pdftoppm`, `pdftotext`가 PATH에 있어야 한다(macOS: `brew install poppler`, Ubuntu: `sudo apt-get install poppler-utils`). 추출 실패 시 렌더링·원본 검수를 했다고 기록하지 않는다.

```sh
npm run notes -- init
```

`.note-sources/catalog.json`과 원본 PDF는 로컬에만 둔다. [catalog.example.json](catalog.example.json)의 구조를 복사해 실제 제목·파일 경로·Section별 페이지를 입력한다. PDF 경로는 `.note-sources/` 기준이며 절대 경로도 가능하다. `pages`는 인쇄된 쪽수가 아닌 **PDF의 1부터 시작하는 페이지 번호 배열**이다. 실제 범위를 알아내지 못했을 때는 빈 배열을 유지하고 확인을 요청한다. 예시의 5.10 제목과 페이지는 의도적으로 비워 둔 것이다.

각 Section에는 `title`, `chapter`, `course`, `category`, `slug`, 숫자 `order`, `summary`, `sources`가 필요하다. `sources`에는 handwritten과 lecture 두 종류가 모두 있어야 한다. 하나의 Chapter PDF를 여러 Section에서 공유할 수 있다. 기존 글과 비교하려면 Section 항목에 `"baseline": "content/notes/gm-ch05-59.md"`를 추가하고 후보에는 새 slug를 쓴다. 기존 원고나 외부 논문은 누락된 필기·강의안을 대신하지 않는다.

## 매번 반복하는 흐름

```sh
git switch -c notes/section-5-10 origin/main
npm run notes -- prepare 5.10
npm run notes -- extract 5.10
```

`prepare`는 원본 SHA-256과 페이지 범위를 고정한 `packet.json`, 집필 요청 `prompt.md`, 초안 `note.md`, 검토 기록 `review.json`을 `.note-work/5.10/`에 만든다. 같은 작업을 다시 준비하면 덮어쓰지 않고 중단한다. 이어서 작업할 때는 기존 패킷을 사용한다. 원본이나 페이지 범위를 바꿔야 하면 이전 작업 폴더를 다른 이름으로 보존한 뒤 다시 준비하고 검토한다.

`extract`는 페이지 PNG와 텍스트를 만든다. 손글씨 인식 모델이나 OCR을 자동으로 실행하지 않는다. 텍스트가 비어도 손글씨가 없는 것이 아니며, 모든 선택 페이지의 PNG를 직접 읽어야 한다. 해석이 불명확하면 원본 기호와 후보 해석을 기록하고, 본문에 `[검토 필요: …]`를 남긴다. 확인 전에는 그 수식에 의존하는 주장을 완성하지 않는다.

에이전트는 [문체 가이드](writing-guide.md)에 따라 작성한다. 내부 출처표와 검수 보고는 공개 본문에 붙이지 않는다. 본문에는 학습 내용, 필요한 학술 참고문헌·캡션, `작성자 검토 전` 표시만 둔다.

```sh
npm run notes -- inventory
npm run notes -- validate 5.10 --draft
npm run notes -- preview 5.10
npm run notes -- serve 5.10
```

`--draft`는 최종 QA 영수증만 생략한 검사이며 출처·수식 경고는 계속 표시한다. `preview`는 기존 빌드 결과를 `.note-work/5.10/preview/`에 복사하고 그 안에만 후보를 추가한다. `dist/`와 공개 콘텐츠에는 후보가 들어가지 않는다. `http://127.0.0.1:4174/review.html`에서 열고, 전체 화면 링크에서 desktop과 mobile(390 px)을 검사한다. `PORT=4175`처럼 포트를 바꿀 수 있다. 서버는 loopback에만 바인딩되며 종료는 Ctrl-C다. 수정 후에는 `preview`를 다시 실행하고 브라우저를 새로고침한다. MathJax는 기존 CDN 연결이 필요하다.

## 검토 기록 형식

`review.json`의 각 필드는 실제 수행한 검토를 기록한다. `true`를 채워 넣는 체크리스트가 아니라 구체적인 설명 문자열을 사용한다.

| 필드 | 기록 내용 |
|---|---|
| `sourceReview` | 각 sourceId, 전체 선택 pages, 검토자 reviewedBy, 대조 내용 notes |
| `items` | 원본의 수식·정의·가정·예제·그림을 빠짐없이 항목화 |
| `questions` | 해석이 불확실하거나 출처끼리 충돌하는 사항. 최종 통합 시 비어 있어야 함 |
| `assets` | 그림·새 demo 파일의 출처, 제작 방식, 수학 검증, 배치 경로 |
| `visualDecision` | 필요한 그림과 생략한 그림의 이유 |
| `interactiveDecision` | Chapter 전체 예산, 기존 컴포넌트 활용, 새 컴포넌트의 필요성 |
| `qa` | 원본 재대조, 수학, 문체, desktop, mobile, 인터랙션의 실제 확인 결과 |

`items`의 한 항목 예시(설명을 위한 형식 예시이며 실제 원본 전사 아님):

```json
{
  "id": "hw-eq-01",
  "sourceId": "chapter-05-handwritten",
  "page": 12,
  "kind": "equation",
  "transcription": "원본 수식의 정확한 LaTeX",
  "status": "verified",
  "noteExcerpt": "본문에 실제로 존재하는 수식 또는 설명의 정확한 부분 문자열",
  "reasoning": "추가한 중간 계산의 근거 또는 두 원본 사이 표기 대응"
}
```

`kind`는 equation / definition / assumption / example / figure / context다. `status: unclear`는 검토 대기이며 통합을 차단한다. 내용이 없는 표지·연결 페이지는 context 항목에 범위를 설명하고 해당 본문의 연결 구절에 연결한다. 검증기는 각 페이지와 항목의 연결을 확인할 뿐, 전사 정확도나 누락 여부를 독립적으로 증명하지 못한다. 원본→항목→본문을 사람이 또는 원본을 직접 읽은 AI가 다시 대조해야 한다.

새 그림은 `.note-work/5.10/assets/content/notes/images/<고유이름>.svg`에 작성하고 본문에서는 `![설명](images/<고유이름>.svg)`로 쓴다. 검토 기록의 asset 예시:

```json
{
  "target": "content/notes/images/section-5-10-figure-1.svg",
  "existing": false,
  "method": "original-svg",
  "description": "그림이 설명하는 수학적 관계",
  "sourceItems": ["hw-eq-01"],
  "reference": {
    "url": "https://원본논문또는강의자료의실제주소",
    "locator": "Figure 번호 / PDF 페이지",
    "checked": "실제로 확인한 축·연결·수식과 제작 시 달리한 점"
  },
  "checks": "독립 계산, 축 단위, 정규화 또는 연결 관계를 검증한 방법과 결과"
}
```

`method`는 original-svg / code / reuse다. reuse에는 `reference.reusePermission`이 필요하다. 로컬 강의안에 공개 URL이 없으면 공개 논문 등 조사한 참고 자료의 실제 URL을 기록하고, 수학적 근거는 sourceItems로 로컬 원본에 연결한다. URL 자체가 내용을 검증하지는 않는다. 참고 이미지를 찾지 못했으면 임의 URL을 만들지 말고 검토 대상으로 남긴다. 기존 이미지를 그대로 쓸 때만 `existing: true`; 파일은 복사하거나 덮어쓰지 않는다. 인터랙티브 UI·커널은 `demos/<고유이름>.html`과 `.mjs` 경로를 사용할 수 있다. [구현 규칙](repository-analysis.md)을 따라 app/portable-preview 연결과 테스트를 별도 수행한다.

`qa`의 필수 문자열: `sourceCoverage`, `mathematics`, `style`, `desktop`, `mobile`, `interactions`. 뷰포트, 검토한 식·그림, 조작과 결과, 테스트 명령·결과, 필요하면 로컬 스크린샷 경로를 기록한다. 인터랙티브가 없으면 생략 사유와 Chapter 예산을 기록한다.

```sh
npm run notes -- fingerprint 5.10
```

실제로 검사한 원고·그림·렌더러의 지문을 `qa.fingerprint`에 저장한다. 원고나 CSS·demo 파일을 바꾸면 지문이 달라져 다시 검토해야 한다. 지문은 내용의 진실성이나 작성자 승인을 의미하지 않는다.

## PR과 게시

```sh
npm run notes -- validate 5.10
npm run notes -- integrate 5.10
npm run check
git diff --check
git diff --stat
```

`integrate`는 main/master/gh-pages와 detached HEAD를 거부한다. 기존 slug·경로가 있으면 실패하며 force 옵션은 없다. 새 Markdown과 명시한 새 asset, `docs/publishing/automation/<slug>.json`만 생성한다. 생성 파일은 PR이 병합되면 게시되도록 `draft: false`가 된다. 검토 표시는 유지된다. 두 원본의 절대 경로와 PDF 자체는 공개 영수증에 포함하지 않는다. 영수증에는 원본 해시·페이지와 원본 전사 일부가 있으므로, 저작권이나 민감한 내용을 포함하는지 PR diff에서 확인한다.

에이전트는 변경 파일을 명시적으로 stage하고 별도 브랜치에 commit/push한 뒤 연결된 GitHub 도구 또는 `gh pr create`로 PR을 만든다. `git add .`로 원본을 무차별 추가하지 않는다. 기존 `.github/workflows/check.yml`은 `npm run check`를 실행하고, 여기에는 새 출처 영수증 검사와 워크플로 테스트가 포함된다. 자동 승인은 하지 않는다. 작성자가 승인·Merge하면 기존 `.github/workflows/deploy.yml`이 main의 내용을 Pages에 게시한다. 저장소의 브랜치 보호 설정을 변경하지 않았으므로 main 차단은 이 CLI와 에이전트 절차의 보장이다.

초기 PR 본문에는 원본 범위, 수식 검토 결과, 그림·컴포넌트, Chapter 예산, 테스트·렌더링 증거, 보류 사항을 포함한다. 검사 결과가 불명확하면 PR/브랜치/CI 상태를 읽고 확인한 뒤 재시도한다. 워크플로는 게시 권한을 부여하거나 Pages CMS에 직접 저장하지 않는다.

## 5.9 비교 시험

```sh
npm run notes -- compare 5.9 --baseline content/notes/gm-ch05-59.md
npm run notes -- preview 5.9
npm run notes -- serve 5.9
```

원본 미등록 상태에서는 기존 원고의 기준값과 “생성 후보 없음” 화면만 만든다. 두 PDF와 5.9 페이지 맵을 등록하고 baseline을 지정한 뒤 prepare→집필→검수를 수행하면 같은 화면에서 기존 원고와 후보를 나란히 비교할 수 있다. 비교 패킷은 integrate할 수 없다. [현재 시험 기록과 평가표](pilot-5.9.md)를 참고한다.
