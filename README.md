# Academic Notes Studio — 운영 가능한 개인 학술 사이트 초안

v3의 흰색 + 연두색 디자인을 유지하면서 **Notes / Experiments / Projects / About / Writing Studio** 기능을 붙인 프로젝트입니다. 실제 게시글 제목과 본문은 한국어, 메뉴·분야명·섹션명은 영어입니다.

**현재 상태:** [GitHub Pages 사이트](https://songofluna.github.io/academic-notes/)가 공개되어 있습니다. 상단 **Write ↗**는 이 저장소의 [Pages CMS 글쓰기 화면](https://app.pagescms.org/songofluna/academic-notes/main/collection/notes)을 새 탭으로 엽니다. GitHub 로그인과 저장소 접근 권한이 필요합니다. 별도의 로컬 스튜디오에서 사용하는 Publish locally 버튼은 내 브라우저에서 보이게 하는 기능이며 **인터넷에 글을 발행하지 않습니다.**

## 1. 빠르게 열어 보기

- 별도의 설치 없이 가장 쉽게 확인: 함께 전달한 **`academic-notes-studio-preview.html`** 파일을 브라우저에서 열기.
- `dist/`는 HTTP 서버에서 제공하세요. MH 데모는 JavaScript 모듈을 사용하므로 `dist/index.html`을 `file://`로 직접 여는 대신 `npm run dev` 또는 `npm run preview`로 만든 단일 HTML을 사용합니다.
- 로컬 서버에서 확인(Mac에 Node.js 설치되어 있으면):

```bash
npm run dev
```

터미널에 표시된 `http://localhost:4173/`로 접속하면 됩니다. `npm install`은 필요하지 않습니다(외부 npm 패키지 0개).

### 사용해 보기

1. 로컬 편집을 체험하려면 홈의 **Explore → Writing Studio ↗** 클릭 (`#/studio`). 온라인 글쓰기는 상단 **Write ↗**를 사용합니다.
2. **+ New note** → 한국어 제목, 영어 slug, Category, Summary, Markdown 본문 작성.
3. 오른쪽 **Live Preview**에서 수식/표/코드/그림 확인.
4. **Save draft**는 초안으로 저장; **Publish locally**는 이 브라우저의 목록에 글을 표시.
5. **Export .md**는 GitHub 또는 CMS로 옮길 수 있는 글 파일 다운로드.
6. **Edit homepage**에서 한국어 소개·Interests·사진 수정. **Manage projects**에서 프로젝트 목록 편집. **Export site.json / projects.json**으로 내려받기.
7. **Download local backup**으로 작성 중인 글과 설정의 JSON 백업 보관. 사진/글에 업로드한 이미지는 **Download local images**로 별도 다운로드 가능합니다.

로컬 데이터는 브라우저 저장소에 남습니다. 다른 컴퓨터, 시크릿 모드, 다른 브라우저와 자동 동기화되지 않으며, 브라우저 데이터를 지우면 사라질 수 있으므로 **백업 또는 실제 CMS에 게시하세요.**

## 2. 온라인 사이트 공개하기 (GitHub Pages)

프로젝트는 Node.js 기본 기능만 사용하여 정적 웹사이트를 생성하고, GitHub Actions로 배포하도록 준비해 두었습니다.

1. GitHub에서 새 저장소를 만들고, 이 폴더의 **소스 파일**을 `main` 브랜치에 업로드합니다. `.github/workflows/deploy.yml`과 `.pages.yml`처럼 `.`으로 시작하는 항목도 업로드해야 합니다. (ZIP을 압축 해제해 깃 저장소로 push하는 방법이 가장 간단합니다.)
2. 저장소에서 **Settings → Pages → Build and deployment → Source: GitHub Actions**를 선택합니다.
3. `main`에 새 commit이 생기면 `.github/workflows/deploy.yml`이 `npm run check`를 실행하고, `dist/`를 GitHub Pages에 배포합니다.
4. **Actions** 탭에서 배포 성공을 확인하고 Pages URL을 엽니다. URL은 `https://USERNAME.github.io/REPOSITORY/` 형식입니다.

정적 사이트는 `#` 경로를 사용하므로 GitHub Pages 하위 폴더에서도 링크가 동작하도록 만들어 두었습니다. 별도 데이터베이스나 서버가 필요하지 않습니다.

## 3. 실제 온라인 관리자에서 글 올리기 — Pages CMS

공식 사이트: <https://pagescms.org/> · 관리자: <https://app.pagescms.org/>

1. **Pages CMS**에 GitHub로 로그인합니다.
2. 안내에 따라 GitHub App을 설치합니다. **이 사이트를 담은 저장소만** 접근 허용해도 됩니다.
3. 저장소를 선택하면 루트의 `.pages.yml` 파일을 자동으로 읽습니다.
4. **Study Notes** → 새 글 작성, Markdown/수식/이미지 삽입, draft 여부 지정 → 저장합니다.
5. **Home / About settings** → 홈페이지 제목·소개·사진 등 수정합니다.
6. **Projects** → 프로젝트 추가/수정합니다.
7. 변경 내용이 GitHub 저장소에 commit되고, 위 Actions 배포가 완료되면 공개 사이트가 갱신됩니다.

**중요:** 사이트 내 **Write ↗**는 `songofluna/academic-notes`의 `main` 브랜치에 있는 **Study Notes** 컬렉션으로 연결됩니다. 로그인과 저장 권한은 Pages CMS와 GitHub에서 확인합니다. **Writing Studio**는 기존처럼 브라우저 안에서만 편집하는 로컬 미리보기입니다.

**초안에 관한 주의:** `draft: true`인 글은 공개 사이트의 JS 번들에 **포함되지 않습니다.** 다만 **GitHub 저장소가 공개 저장소라면 소스 파일은 GitHub에서 읽을 수 있습니다.** 민감한 내용은 공개 저장소에 저장하지 마세요.

## 4. 파일 구성과 수정 위치

| 파일/폴더 | 용도 |
|---|---|
| `data/site.json` | 홈페이지 이름·소개·관심 분야·사진 경로·About 등 |
| `data/projects.json` | 프로젝트 목록 |
| `content/notes/*.md` | 글별 Markdown 파일 (YAML frontmatter 포함) |
| `assets/hero-photo.webp` | 홈페이지 오른쪽 사진 (현재는 생성한 임시 사진) |
| `styles.css` | 흰색·연두색 색상과 글꼴·간격·반응형 디자인 |
| `app.js` | 페이지, 에디터, 인터랙티브 그래프, 검색 |
| `demos/metropolis-hastings.html` | MH 시뮬레이터 UI와 Canvas 그래프 |
| `demos/mh-kernel.mjs` | UI와 테스트가 함께 사용하는 실제 MH 샘플러 |
| `.pages.yml` | Pages CMS 글쓰기·설정·사진 업로드 화면 구성 |
| `scripts/build.mjs` | `.md`와 `.json`을 합쳐 배포 파일 생성 |
| `.github/workflows/deploy.yml` | GitHub Pages 자동 빌드/배포 |
| `dist/` | 생성된 공개 사이트 (소스 수정 대상이 아님) |

수정한 뒤 정적 웹사이트를 다시 만드는 방법:

```bash
node scripts/build.mjs
```

`content/notes/`가 비어 있거나 폴더 자체가 없어도 글 0개로 빌드됩니다. 설정·사진·프로젝트는 그대로 포함됩니다. 잘못된 글 형식, 중복 slug, 기타 파일 접근 오류는 계속 빌드를 실패시킵니다.

현재 구축한 사이트는 **프레임워크 없는 정적 구조**입니다. 향후 Astro/MDX 등으로 옮기더라도 게시글 `.md`와 사이트 데이터 `.json`을 별도로 보관하므로 콘텐츠 이전이 쉽습니다.

## 5. 글 파일 예시

`content/notes/my-first-note.md`

````markdown
---
slug: "my-first-note"
title: "제목은 한국어로"
date: "2026-10-10"
category: "generative"
summary: "글 목록에 나타날 간단한 설명"
tags: "Bayesian Inference, ELBO"
draft: false
sample: false
---

## ELBO를 유도해 보기

$$
\log p(x) = \mathcal{L}(q) + \mathrm{KL}(q(z)\,\|\,p(z\mid x))
$$

```python
import numpy as np
```

[demo:normal-kl]
````

`[demo:normal-kl]`은 정규분포 비교 그래프를, `[demo:metropolis-hastings]`는 두 가지 MH 실험을 글 안에 삽입합니다. 각 명령어를 본문에서 독립된 한 줄에 입력하세요. 코드 블록 안에서는 실행되지 않고 원문으로 표시됩니다.

## 6. 수식이 문장과 자연스럽게 이어지도록 작성하기 (v4.1)

기존 v4에는 수식 앞뒤에 회색 구분선이 있었지만, v4.1에서는 **그 선을 제거**했습니다. 수식은 본문 속에서 일반적인 학술 교재처럼 표시됩니다. 수식 종류에 따라 글쓰기 툴바에서 `$x$` 또는 `∑ Block`을 누르세요.

문장 중간에 넣을 때는 `$...$` 또는 `\(...\)`를 사용합니다.

```markdown
표본평균 $\bar X_n$은 일정한 조건에서 정규분포로 수렴한다.
```

독립된 식을 가운데 놓을 때는 `$$`를 **각각 독립된 줄**에 적습니다.

```markdown
중심극한정리(CLT)는 다음과 같이 표현할 수 있다.

$$
\frac{\sqrt n(\bar X_n-\mu)}{\sigma} \xrightarrow{d} N(0,1)
$$

이 결과는 모집단의 분포가 정규분포가 아니어도 성립한다.
```

닫는 `$$` 뒤에 `는`이나 다른 글자를 붙이기보다 다음 줄에서 설명을 이어 쓰는 것을 권장합니다. v4.1에서는 닫는 `$$` 뒤 텍스트도 수식 내부로 들어가지 않도록 파서를 보완했습니다. 단, 게시글 소스가 잘못된 LaTeX 자체라면 MathJax도 올바르게 그리지 못할 수 있습니다.

## 7. 이 저장소의 온라인 발행 절차

저장소: [songofluna/academic-notes](https://github.com/songofluna/academic-notes) · 공개 주소: [GitHub Pages](https://songofluna.github.io/academic-notes/)

1. 사이트 상단 **Write ↗** → Pages CMS에 GitHub로 로그인 → **Study Notes**에서 새 글 작성·저장. CMS의 Markdown **Source** 모드에서 LaTeX를 입력하면 특수 구문을 유지하기 편합니다.
2. CMS 저장 또는 PR 병합으로 `main`에 변경 사항이 생기면 **Deploy website**가 `npm run check`를 실행하고 `dist/`를 배포합니다.
3. [Actions](https://github.com/songofluna/academic-notes/actions)에서 해당 commit의 배포 성공을 확인하고 공개 사이트에서 글·사진을 확인합니다.

PR의 **Check website**는 검증만 수행합니다. 공개 사이트는 `main` 변경 시 갱신되므로, PR 검증 성공과 실제 배포 성공을 구분해서 확인하세요.

## 8. 이미지와 LaTeX에 대한 주의

- 글에서 이미지 업로드 기능은 우선 브라우저 로컬로 저장합니다. 실제 게시 시에는 해당 이미지를 GitHub의 `assets/` 또는 Pages CMS 미디어 라이브러리에 별도 업로드한 뒤 경로를 맞춰 주세요. 임시 이미지가 영구 서버에 저장되지는 않습니다.
- `$$ ... $$` / `$ ... $` / `\( ... \)` 등의 수식 렌더링은 MathJax 3 CDN을 사용합니다. 인터넷이 없는 환경에서는 LaTeX 원문으로 보일 수 있습니다.
- 기본 Markdown 제목/목록/표/코드/이미지/링크/수식을 지원합니다. 현재 편집기는 **완전한 Notion형 WYSIWYG 에디터는 아닙니다.** 실제 Pages CMS에서는 rich-text 편집을 사용할 수 있습니다.
- 방문 통계, 별도 작성자 로그인, 댓글 서비스, 검색엔진 최적화(사이트맵 등)는 향후 선택적으로 추가해야 합니다.

## 9. 테스트

```bash
npm run check
npm run preview
```

`npm run check`는 JavaScript 구문 검사, 임시 디렉터리에서 실행하는 빌드 회귀 테스트, 실제 콘텐츠 빌드를 수행합니다. 회귀 테스트는 빈/없는 글 폴더, 본문 보존, 초안 제외, 잘못된 글 형식, 중복 slug, 예상하지 못한 파일 오류를 확인합니다. 테스트 과정에서 기존 사용자 글을 수정하거나 삭제하지 않습니다.

MH 검사는 실제 배포되는 샘플러를 직접 가져옵니다. 정규 proposal의 평균·분산·좌표 독립성, 대칭성, acceptance ratio, detailed balance, 거절 상태 유지, seed 재현성, 체인 앞부분 보존, 등고선, 장기 표본 통계를 검증합니다. `demos/`의 HTML과 모듈이 빈 글 폴더 빌드에도 그대로 복사되는지 확인합니다.

브라우저에서는 Write의 CMS 이동, 기존 글과 사진, Markdown 제목·목록·표·인용문, 인라인/블록 LaTeX, 코드, `assets/` 및 `/assets/` 이미지 경로를 확인하세요. MathJax는 인터넷 연결이 필요합니다. CMS 로그인 후 실제 저장은 기존 사용자 글에 영향을 줄 수 있으므로 표시 검사와 별도로 수행합니다.

## 10. Metropolis–Hastings 노트 작성

1. [Write / Study Notes](https://app.pagescms.org/songofluna/academic-notes/main/collection/notes)에서 새 글을 만듭니다.
2. 제목과 고유한 영문 slug 등을 입력하고, **Body → Source** 모드에서 원하는 위치에 아래 내용을 입력합니다. 명령어는 코드 블록이나 인라인 코드로 감싸지 않습니다.

```markdown
## Metropolis–Hastings 실험

대칭 proposal에서는 채택확률이 $\min(1,\pi(x')/\pi(x))$입니다.

[demo:metropolis-hastings]

proposal 크기를 바꾸면서 mixing을 관찰해 봅시다.
```

3. 공개하려면 **Draft**를 끄고 저장합니다. GitHub Actions 배포가 성공하면 해당 Notes 글에서 시뮬레이터가 나타납니다. Pages CMS 편집기 자체는 이 사용자 정의 명령어를 실행하지 않습니다.

[Experiments](https://songofluna.github.io/academic-notes/#/experiments)와 [독립 시뮬레이터](https://songofluna.github.io/academic-notes/demos/metropolis-hastings.html)에서도 사용할 수 있습니다. 여러 글이나 같은 글의 여러 위치에 넣어도 각각 독립적으로 작동합니다. 기존 정규분포 실험은 유지됩니다.

### 조작과 계산 방식

- **Iterations**: 10 / 100 / 1,000 / 10,000 버튼 또는 0–12,000 슬라이더. 같은 분포·σ·seed에서는 하나의 체인을 재사용하므로 횟수를 늘리거나 되돌려도 같은 표본 순서입니다.
- **Proposal σ**: 1D의 표준편차, 2D에서는 각 좌표의 표준편차입니다. 변경하면 새 설정으로 체인을 다시 계산하여 현재 반복 횟수까지 표시합니다.
- **Next step / +100 / Play / Pause**: 체인을 진행합니다. **Reset**은 같은 seed의 시작점으로 돌아가고, **New random run**은 seed를 바꿉니다.
- 1D는 정규 혼합 목표밀도와 표본 히스토그램, 최근 240단계 trace를 표시합니다. 2D는 바나나 목표분포의 정확한 등고선, 모든 표본 위치, 최근 60단계 이동 경로를 표시합니다.
- 고정 대칭 Gaussian random walk를 사용하므로 proposal 비율은 상쇄됩니다. 로그 공간에서 `log(u) < min(0, log π(new) − log π(current))`를 계산하며, 거절되면 현재 상태를 다음 표본으로 다시 기록합니다. 알고리즘 기준: [CMU MCMC 강의 노트](https://www.math.cmu.edu/~gautam/c/2025-326/notes/sampling4-mcmc.html).

제공된 `mh-site-integration.zip`의 시뮬레이터를 현재 사이트 코드에 병합했으며, 샘플러 분리·로그 밀도 안정화·등고선·iframe 자동 높이·키보드 탭 조작을 보완했습니다. MH 데모는 외부 라이브러리 없이 동작합니다. `demos/`는 빌드 때 배포 결과물에 포함되고 상대 경로로 로딩되므로 `/academic-notes/` 하위 경로에서 사용할 수 있습니다.

### 통계 검증과 제약

고정 seed 8개로 분포별 100,000단계씩 실행하고, 검증용으로 각 체인의 처음 10,000단계를 제외한 **720,000개** 표본을 모았습니다. `npm run check`에서 같은 검증을 재현할 수 있습니다.

| 통계량 | 이론값 | 검증 표본 |
|---|---:|---:|
| 1D 평균 | −0.54000 | −0.54420 |
| 1D 분산 | 5.08209 | 5.07054 |
| 2D X 평균 | 0 | −0.01243 |
| 2D Y 평균 | 0 | −0.01152 |
| 2D X 분산 | 2.72250 | 2.67084 |
| 2D Y 분산 | 0.90422 | 0.86784 |
| 2D Cov(X,Y) | 0.40838 | 0.38175 |

1D는 가중치 `(0.38, 0.38, 0.24)`, 평균 `(−3, 0, 2.5)`, 표준편차 `(0.6, 0.85, 0.42)`의 Gaussian mixture입니다. 2D는 독립인 `X ~ N(0, 1.65²)`, `E ~ N(0, 0.5²)`에 대해 `Y = 0.2(X² − 1.65²) + 0.15X + E`입니다. 테스트는 세 모드 구간의 확률질량과 2D 잠재 잔차의 평균·분산도 확인합니다.

이 검사는 구현의 회귀 검증이며, 모든 seed·σ에서 12,000단계 이내 수렴을 보장하지 않습니다. 화면은 mixing을 관찰하도록 초기 구간과 반복 상태를 모두 포함합니다. 축 범위를 벗어난 값은 그림에서만 생략하고 표본·acceptance 집계에는 포함합니다. 현재 목표분포는 고정되어 있으며 사용자 정의 분포와 표본 내보내기는 지원하지 않습니다.
