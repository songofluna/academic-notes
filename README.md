# Academic Notes Studio — 운영 가능한 개인 학술 사이트 초안

v3의 흰색 + 연두색 디자인을 유지하면서 **Notes / Experiments / Projects / About / Writing Studio** 기능을 붙인 프로젝트입니다. 실제 게시글 제목과 본문은 한국어, 메뉴·분야명·섹션명은 영어입니다.

**현재 상태:** 홈페이지와 로컬 글쓰기 스튜디오는 작동합니다. GitHub Pages 자동 배포와 Pages CMS 설정 파일도 포함되어 있습니다. 다만 GitHub 계정 승인/레포지토리 연결이 아직 이루어지지 않았으므로 **온라인 발행은 아직 연결되지 않았습니다.** 로컬 Publish 버튼은 내 브라우저에서 보이게 하는 기능이며 **인터넷에 글을 발행하지 않습니다.**

## 1. 빠르게 열어 보기

- 별도의 설치 없이 가장 쉽게 확인: 함께 전달한 **`academic-notes-studio-preview.html`** 파일을 브라우저에서 열기.
- 압축 파일을 풀었다면 **`dist/index.html`**을 열어도 됩니다. `dist/`의 다른 파일도 함께 두세요.
- 로컬 서버에서 확인(Mac에 Node.js 설치되어 있으면):

```bash
npm run dev
```

터미널에 표시된 `http://localhost:4173/`로 접속하면 됩니다. `npm install`은 필요하지 않습니다(외부 npm 패키지 0개).

### 사용해 보기

1. 사이트 상단의 **Write ↗** 클릭.
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
3. 저장소에 새 commit이 생기면 `.github/workflows/deploy.yml`이 `node scripts/build.mjs`를 실행하고, `dist/`를 GitHub Pages에 배포합니다.
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

**중요:** GitHub 연동 후 온라인 글을 올릴 때는 Pages CMS를 사용하세요. 사이트 내 Write ↗는 그 전 단계에서 체험하는 **로컬 스튜디오**입니다. 실서비스에서 사이트 안에 로그인한 작성자만 접근하는 완전한 관리자 화면을 만들려면 추가적인 인증/서버 기능이 필요합니다. 현재 누구나 Write 화면을 열 수 있지만, 타인에게 공개된 GitHub 저장소를 수정할 권한은 제공하지 않습니다.

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
| `.pages.yml` | Pages CMS 글쓰기·설정·사진 업로드 화면 구성 |
| `scripts/build.mjs` | `.md`와 `.json`을 합쳐 배포 파일 생성 |
| `.github/workflows/deploy.yml` | GitHub Pages 자동 빌드/배포 |
| `dist/` | 생성된 공개 사이트 (소스 수정 대상이 아님) |

수정한 뒤 정적 웹사이트를 다시 만드는 방법:

```bash
node scripts/build.mjs
```

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

`[demo:normal-kl]`은 미리 제공한 정규분포 비교 그래프를 글 안에 삽입합니다. 신규 인터랙티브 노트는 `app.js`에 기능을 추가하면 됩니다.

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

## 7. GitHub에 배포하기 — 이 계정용 실제 절차

확인된 GitHub 계정: `songofluna` · 추천 새 저장소명: `academic-notes` · 공개 주소(배포 완료 시): `https://songofluna.github.io/academic-notes/`

1. GitHub의 [새 저장소 만들기](https://github.com/new)에서 **Repository name: academic-notes**, **Public**, **Add a README file** 체크 후 `Create repository`를 클릭합니다. 기존 통계·머신러닝 프로젝트 저장소를 덮어쓰지 마세요.
2. 새 저장소 URL(`https://github.com/songofluna/academic-notes`)을 알려주면 연결된 GitHub 도구로 업로드 가능한지 확인할 수 있습니다. 도구가 쓰기를 허용하지 않으면 이 ZIP을 풀어 업로드하는 방법으로 진행합니다.
3. 업로드할 것은 이 프로젝트 폴더의 소스 파일입니다. `.github/workflows/deploy.yml`과 `.pages.yml`을 반드시 포함하세요.
4. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**를 선택하고 Actions에서 배포가 성공하는지 확인합니다.
5. 실제 온라인 글쓰기: [Pages CMS](https://app.pagescms.org/)에 GitHub로 로그인 → 저장소 권한 부여 → `Study Notes`에서 새 글 작성·저장. CMS의 Markdown **Source** 모드에서 LaTeX를 입력하면 특수 구문을 유지하기 편합니다.

**중요:** GitHub 연결은 실제 저장소를 생성하고 코드가 업로드된 이후에 완료됩니다. 현재 첨부한 ZIP은 배포 준비물이며, 아직 GitHub Pages에 올라간 상태가 아닙니다.

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

브라우저 테스트 기준: 홈/검색/글 읽기/그래프 조작/초안/로컬 발행/홈페이지 설정/모바일 레이아웃을 확인했습니다. GitHub 계정 연동을 요구하는 Pages CMS 저장 및 외부 GitHub Pages 배포는 **연결 전 단계라 실제 원격 계정으로 테스트하지 않았습니다.**
