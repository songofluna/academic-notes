# 저장소 분석과 통합 규칙

분석 기준은 `main`의 `1ccf3174d8953267b0df768be87a9765c40a5e18`이다. 기존 노트는 24개이며 5.9 원고와 네 개의 author-supplied JPEG, WaveNet 인터랙티브가 이미 포함되어 있다. 기존 로컬 테스트 59개가 모두 통과했고, 해당 main의 [Pages 배포](https://github.com/songofluna/academic-notes/actions/runs/41728181318)와 직전 [PR 검사](https://github.com/songofluna/academic-notes/actions/runs/41728057414)가 성공했다. 작업 전부터 남아 있는 CI 실패를 발견하지 않았다.

## 현재 구조

| 위치 | 확인한 역할 / 자동화에서 유지할 계약 |
|---|---|
| `content/notes/*.md` | flat YAML frontmatter + Markdown. slug가 `#/notes/<slug>` 주소를 결정 |
| `scripts/build.mjs` | notes/articles·site/projects를 읽고 `dist/site-data.js` 생성. draft 제외. images와 demos 복사 |
| `scripts/lib/post.mjs` | 기존 build의 frontmatter 파서를 그대로 추출한 공유 모듈. 집필 도구와 빌드가 같은 스키마 사용 |
| `assets/content-model.js` | Course·Chapter 그룹과 글 순서. `content/courses/*.json`은 현재 빌드에서 미사용 |
| `app.js` | hash route, 자체 Markdown 파서, MathJax 호출, TOC, shortcode, 지연 iframe 로딩 |
| `index.html` | MathJax 3 CDN 설정, 로컬 Prism 및 데이터 로딩 |
| `styles.css` / `DESIGN.md` | 흰색·연두색, 208px 저자 영역, 약 780px 읽기 영역, 760px 이하 단일 열 |
| `content/notes/images/` | 배포 때 `dist/images/`로 복사. 본문은 `images/name.svg` 사용 |
| `demos/*.html` / `*.mjs` | UI와 계산 커널 분리. 독립적인 수학 테스트 존재 |
| `scripts/preview.mjs` | 기존 휴대용 단일 HTML. 커널 import를 인라인으로 바꿔 모듈 포함 |
| `.github/workflows/check.yml` | PR에서 `npm run check`만 실행 |
| `.github/workflows/deploy.yml` | main push 또는 수동 실행에서 check→build→Pages deploy |

새 자동화는 renderer, CSS, index, CMS, 기존 노트와 demo를 수정하지 않는다. build의 parser만 내용 변경 없이 공유 모듈로 옮겼다. 기존 테스트가 flat scalar, 목록, 블록 문자열, 수식 원문, 빈 컬렉션과 draft 제외를 계속 검증한다. 새 `npm run check` 단계는 자동화 영수증이 있을 때 파일 해시와 검토 기록을 검사한다.

## Markdown과 수식

이 사이트는 MDX/React가 아닌 자체 파서를 사용한다. 임의 HTML과 JSX 컴포넌트를 본문에 붙이지 않는다. 본문은 H1–H4, 목록, 인용, 표, fenced code, 이미지, 링크와 수식을 지원한다. 인라인은 `$...$` 또는 `\(...\)`, display는 독립된 줄의 `$$` 또는 `\[...\]`를 사용한다. 행렬·aligned의 행 구분은 실제 `\\`다. 수식은 parser에서 보호된 뒤 MathJax로 전달되므로 LaTeX 역슬래시를 JSON처럼 이중 이스케이프하지 않는다.

표 안의 수직선 `|`는 현재 parser의 열 구분과 충돌할 수 있다. 조건부 확률에는 `\mid`, norm에는 적절한 LaTeX 명령을 쓰고 실제 출력으로 확인한다. `<!-- evidence -->` 같은 HTML 주석은 숨은 출처 저장소로 쓰지 않는다. 출처 연결은 sidecar JSON에 둔다.

`draft: true` 글은 공개 payload에서 제외되지만 이미지와 demos 폴더는 전체 복사된다. 따라서 미검토 asset도 처음부터 공개 경로에 저장하지 않고 `.note-work/`에 둔다. 원본 PDF는 `.note-sources/` 밖의 공개 콘텐츠 경로에 넣지 않는다.

## 시각화와 인터랙티브 확장

기존 shortcode는 normal-kl, metropolis-hastings, empirical-distribution, made-mask-explorer, pixelcnn-blind-spot, gated-pixelcnn-stacks, wavenet-dilation이다. normal-kl은 app 내부 SVG이고 나머지는 독립 iframe이다. 실제 커널 함수는 UI와 tests가 동일한 모듈을 import한다.

새 컴포넌트가 필요한 경우:

1. 수식·가정·범위·입출력과 검증할 불변량을 원본 항목에 연결한다. 확률 정규화, 경계값, 인과성, 연결 범위 등 해당 모델에 의미 있는 것을 선택한다.
2. `demos/<name>-kernel.mjs`에 순수 계산 함수를 만들고 독립 공식 또는 작은 수작업/완전탐색 계산과 비교한다. UI를 구현한 식을 그대로 복사한 테스트로 검증을 대신하지 않는다. 난수 실험은 seed 재현성을 제공한다.
3. `demos/<name>.html`에서 그 함수를 import하고 실제 슬라이더·select·reset에 연결한다. 필요한 축·단위·범례·측정값만 넣고 설명은 주변 본문에 쓴다. CSS는 기존 demo의 간격·색상·폰트를 따른다.
4. `app.js`의 demo HTML 생성, Markdown shortcode 처리, `setupExperiments`의 lazy selector와 packed preview 선택, resize message 수신부에 새 타입을 연결한다. 현재 `wavenet-dilation.html`과 `app.js`의 WaveNet 경로를 함께 참고하고 iframe source 검사를 보존한다.
5. `scripts/preview.mjs`에 새 HTML·모듈의 인라인 처리를 추가한다. `tests/preview.test.mjs` 및 shortcode 테스트에서 코드 블록 안은 실행되지 않고 실제 본문에서만 실행되는지 확인한다.
6. desktop/mobile에서 lazy load, 높이 메시지, 키보드, 모든 조작과 경계값, reset, 스크롤을 확인한다. 그래프는 좁은 화면에서 글 전체가 아닌 그래프 컨테이너 안에서 스크롤되어야 한다.

원본에 필요한 그림은 관련 논문·강의자료의 그림을 조사한 뒤 직접 SVG/code로 작성한다. 링크·그림번호·확인한 대응 관계를 기록하고, 재사용하는 경우 허용 근거도 기록한다. 그림을 그럴듯하게 만들기 위해 데이터나 실험 결과를 지어내지 않는다.

## Chapter 5 예산

현재 5.6 MADE, 5.7.2 PixelCNN, 5.8.1 Gated PixelCNN, 5.9 WaveNet에 하나씩, 총 4개의 embed가 있다. 이는 새 목표 1–3개보다 많지만 기존 저자의 선택을 바꾸지 않는다. 자동화는 이 상태를 경고로 기록하고 5번째 embed의 추가를 차단한다. 5.9 비교는 기존 5.9를 후보로 대체했을 때의 수를 계산하며 같은 실험을 두 번 더한 것으로 계산하지 않는다. 새 Chapter는 전체 필요를 먼저 계획하고 꼭 필요한 1–3개를 배치한다. 모든 Section에 하나씩 넣는 규칙은 아니다.

## 보장 범위

CLI는 원본 바이트 변경, 페이지/항목 연결 누락, 남은 검토 표시, 파일 충돌, 검수 지문 변경을 확인한다. 수학·문체·출처의 의미는 원본을 읽는 검토 단계에서 판단한다. 이 PR은 GitHub의 main 브랜치 보호 설정이나 사용자 권한을 변경하지 않는다. 별도 브랜치와 작성자 Merge 절차를 유지하고 기존 Pages 방식으로만 게시한다.
