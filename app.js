/* Academic Notes Studio — standalone static site, offline editing demo.
 * Public publishing is performed through authenticated Pages CMS + GitHub Pages.
 */
(() => {
  'use strict';
  const DATA = window.SITE_DATA;
  const app = document.getElementById('app');
  if (!DATA || !app) { if(app) app.textContent='Site data is missing. Run: npm run build'; return; }
  const STORAGE_KEY = 'academic-notes-studio-local-v1';
  const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'probability', label: 'Probability & Statistics' },
    { id: 'generative', label: 'Generative Models' },
    { id: 'graphs', label: 'Graph Learning' },
    { id: 'deep-learning', label: 'Deep Learning' },
  ];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = Object.fromEntries(CATEGORIES.map(x=>[x.id,x.label]));
  const emptyLocal = () => ({ notes:{}, deleted:[], site:{}, images:{}, projects:null });
  let persistent = true;
  let local = emptyLocal();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) local = { ...emptyLocal(), ...JSON.parse(raw) };
  } catch (err) {persistent = false; console.warn('Local storage unavailable', err);}
  let notesFilter = 'all';
  let notesQuery = '';
  let toastTimer = 0;
  let editorTimer = 0;
  let lastEditorSlug = null;
  const sampleNote = n => n.sample ? '<span class="sample-tag"> · Sample</span>' : '';
  const normalizeTags = input => (Array.isArray(input) ? input : String(input||'').split(',')).map(x=>String(x).trim()).filter(Boolean);
  function saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(local)); persistent = true; return true; }
    catch (error) { console.warn('Local storage write failed', error); persistent=false; toast('저장 공간이 부족하거나 브라우저 저장이 차단되었습니다. 백업 파일을 내려받으세요.'); return false; }
  }
  function toast(message) {
    const node = $('toast'); if(!node) return;
    node.textContent=message; node.hidden=false;
    window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>{node.hidden=true;},3600);
  }
  const site = () => ({...DATA.site, ...local.site});
  function allNotes() {
    const base = DATA.notes.filter(x=>!local.deleted.includes(x.slug)).map(n=> ({...n,...(local.notes[n.slug] || {}),localEdit:!!local.notes[n.slug]}));
    const fresh = Object.values(local.notes).filter(n=>n && !DATA.notes.some(b=>b.slug===n.slug) && !local.deleted.includes(n.slug)).map(n=>({...n,localEdit:true}));
    return [...base,...fresh].sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')) || a.title.localeCompare(b.title));
  }
  const publicNotes = () => allNotes().filter(n => !n.draft);
  const noteBySlug = slug => allNotes().find(n=>n.slug===slug);
  function slugify(s) {return String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72);}
  const localCount=()=>Object.keys(local.notes).length + Object.keys(local.site).length + Object.keys(local.images).length + (local.projects?1:0);
  function safeUrl(url) {
    const s=String(url||'').trim();
    if (/^(https?:\/\/|mailto:|#|\.\.?\/|assets\/|\/assets\/)/i.test(s)) return s;
    if (/^data:image\/(png|webp|jpeg|gif);base64,/i.test(s)) return s;
    return '#';
  }
  function mediaUrl(input) {
    const src=String(input||'').trim();
    const norm=src.startsWith('/') ? src.slice(1) : src;
    if (local.images[norm]) return local.images[norm];
    if (norm.startsWith('assets/')) return norm;
    if (/^(https?:\/\/|data:image\/)/i.test(src)) return safeUrl(src);
    return safeUrl(src);
  }
  function route() {
    const p=decodeURIComponent(location.hash.slice(1).split('?')[0] || '/');
    return p.startsWith('/') ? p : '/';
  }
  function go(path){ if(location.hash==='#'+path) render(); else location.hash='#'+path; }
  function brand(name){return esc(name.replace(/\.$/,'').trim() || 'notes')+'<span class="dot">.</span>';}
  function renderNav(path) {
    const menus=[['Home','/'],['Notes','/notes'],['Experiments','/experiments'],['Projects','/projects'],['About','/about'],['Write','/studio']];
    $('site-brand').innerHTML=brand(site().siteName || 'notes.');
    $('primary-nav').innerHTML=menus.map(([name,url])=>`<a href="#${url}" ${path===url || path.startsWith(url+'/') && url!=='/' ? 'aria-current="page"':''} class="${url==='/studio'?'nav-write':''}">${esc(name)}${name==='Write'?' ↗':''}</a>`).join('');
    document.title=`${site().siteName || 'notes.'} — ${path==='/'?'Study Notes':path.includes('editor')?'Editor':(path.split('/')[1]||'Notes')}`;
    $('footer-note').textContent='Personal academic notes · '+(localCount() ? 'Local editing preview (not yet published)' : 'Work in progress');
  }
  function pageLead(label,title,description,extra='') {
    return `<div class="page-lead"><span class="overline">${esc(label)}</span><h1>${esc(title)}</h1>${description?`<p class="lead-text">${esc(description)}</p>`:''}${extra}</div>`;
  }
  function filtersHtml(active='all') {return `<div class="filters" id="note-filters" role="group" aria-label="Note categories">${CATEGORIES.map(x=>`<button type="button" class="filter" data-filter="${x.id}" aria-pressed="${x.id===active}">${x.label}</button>`).join('')}</div>`;}
  function noteRows(notes) {
    if(!notes.length) return '<p class="no-results">표시할 글이 없습니다. 검색어나 카테고리를 바꿔 보세요.</p>';
    return notes.map(n=>`<article class="entry"><div class="entry-top"><a class="entry-title" href="#/notes/${encodeURIComponent(n.slug)}">${esc(n.title)}</a><span class="entry-meta">${esc(n.date||'')} · ${esc(labels[n.category]||n.category||'Note')}${sampleNote(n)}${n.localEdit?'<span class="local-mark">Local</span>':''}</span></div><p>${esc(n.summary)}</p></article>`).join('');
  }
  const currentProjects = () => Array.isArray(local.projects) ? local.projects : DATA.projects;
  function projectRows(short=false) {
    return (short?currentProjects().slice(0,2):currentProjects()).map(p=>`<article class="${short?'project':'project-entry'}"><h3>${p.url?`<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">${esc(p.title)} ↗</a>`:esc(p.title)}${p.sample?'<span class="sample-tag"> · Sample</span>':''}</h3><p>${esc(p.description)}</p><p class="meta">${esc(p.stack||'')}</p></article>`).join('');
  }
  function experimentHtml(id='home') {
    const pre=id.replace(/[^a-z0-9-]/gi,'');
    return `<div class="demo" data-normal-demo="${pre}" aria-label="Compare two normal distributions">
      <div class="demo-line"><span class="demo-title">Comparing two normal distributions</span><span class="kl">KL(q ∥ p) = <strong data-kl>0.00</strong></span></div>
      <div class="legend"><span><i></i> p(x) = N(0, 1)</span><span><i class="q"></i> q(x) = N(μ, σ²)</span></div>
      <svg class="curve" viewBox="0 0 550 242" role="img" aria-label="Two Gaussian density curves">
        <g stroke="#eef1ec" stroke-width="1"><line x1="31" y1="58" x2="523" y2="58"/><line x1="31" y1="107" x2="523" y2="107"/><line x1="31" y1="156" x2="523" y2="156"/><line x1="31" y1="205" x2="523" y2="205"/></g>
        <path data-p-curve stroke="#7d9992" stroke-width="2.5" stroke-linecap="round" fill="none"/><path data-q-curve stroke="#79aa43" stroke-width="2.7" stroke-linecap="round" fill="none"/>
        <g fill="#9da99f" font-size="10" font-family="monospace" text-anchor="middle"><text x="31" y="226">−4</text><text x="154" y="226">−2</text><text x="277" y="226">0</text><text x="400" y="226">2</text><text x="523" y="226">4</text></g>
      </svg>
      <div class="controls"><div class="control"><label for="${pre}-mu">Mean μ</label><input type="range" data-mu id="${pre}-mu" min="-2.2" max="2.2" step="0.1" value="1.1"><output data-mu-value for="${pre}-mu">1.1</output></div><div class="control"><label for="${pre}-sigma">Std. dev. σ</label><input type="range" data-sigma id="${pre}-sigma" min="0.6" max="1.8" step="0.05" value="0.85"><output data-sigma-value for="${pre}-sigma">0.85</output></div></div>
      <div class="demo-footer"><span>KL divergence is zero when the distributions are identical.</span><button class="reset" type="button" data-reset-plot>Reset ↺</button></div></div>`;
  }
  function setupExperiments(scope=app) {
    const normal=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
    function curve(mean,std){return Array.from({length:241},(_,i)=>{const x=-4+8*i/240;return `${i===0?'M':'L'}${(31+(x+4)*492/8).toFixed(2)},${(205-normal(x,mean,std)*320).toFixed(2)}`;}).join(' ');}
    scope.querySelectorAll('[data-normal-demo]').forEach(node=>{
      const mu=node.querySelector('[data-mu]'),sigma=node.querySelector('[data-sigma]');
      if(!mu || !sigma) return;
      const redraw=()=>{
        const m=Number(mu.value),s=Number(sigma.value);
        node.querySelector('[data-p-curve]').setAttribute('d',curve(0,1));
        node.querySelector('[data-q-curve]').setAttribute('d',curve(m,s));
        node.querySelector('[data-kl]').textContent=(.5*(m*m+s*s-1-Math.log(s*s))).toFixed(3);
        node.querySelector('[data-mu-value]').textContent=m.toFixed(1);
        node.querySelector('[data-sigma-value]').textContent=s.toFixed(2);
      };
      mu.addEventListener('input',redraw);sigma.addEventListener('input',redraw);
      node.querySelector('[data-reset-plot]').addEventListener('click',()=>{mu.value='1.1';sigma.value='0.85';redraw();});
      redraw();
    });
  }
  function renderHome() {
    const s=site();
    app.innerHTML=`<section class="intro" aria-labelledby="intro-title">
        <div class="intro-copy"><p class="intro-label">${esc(s.introLabel)}</p><h1 id="intro-title">${esc(s.introTitle)}</h1><p class="intro-body">${esc(s.introDescription)}</p>
          <p class="interests"><span>Interests</span>${normalizeTags(s.interests).map((item,i)=>`${i?'<span class="divider">/</span>':''}<strong>${esc(item)}</strong>`).join('')}</p>
        </div><figure class="intro-photo"><img src="${esc(mediaUrl(local.site.heroImageData||s.heroImage))}" alt="${esc(s.heroAlt)}"><figcaption class="visually-hidden">Hero photograph</figcaption></figure>
      </section>
      <div class="main-grid"><div class="column">
        <section id="notes"><div class="section-heading"><h2>Recent Notes</h2><a class="small-link" href="#/notes">All notes ↗</a></div>${filtersHtml()}<div id="home-note-list">${noteRows(publicNotes().slice(0,4))}</div></section>
        <section class="experiment" id="experiment"><span class="head-annotation">Interactive Note / 01</span><h2>정규분포를 움직여 보기</h2><p class="explain">평균과 표준편차를 바꾸며 두 정규분포 사이의 KL divergence를 확인합니다.</p>${experimentHtml('home')}</section>
        <section id="projects"><div class="section-heading"><h2>Projects</h2><a href="#/projects" class="small-link">View all ↗</a></div><div class="project-list">${projectRows(true)}</div></section>
        <section id="about"><div class="section-heading"><h2>About</h2><a href="#/about" class="small-link">More ↗</a></div><p class="about-copy">${esc(s.about)}</p></section>
      </div><aside class="sidebar"><div class="side-group"><h3>Explore</h3><a href="#/notes">Study Notes ↗</a><a href="#/experiments">Interactive Notes ↗</a><a href="#/projects">Projects ↗</a><a href="#/studio">Writing Studio ↗</a></div>
      <div class="side-group"><div class="side-line"></div><h3>Currently Studying</h3>${normalizeTags(s.currentlyStudying).map(t=>`<p class="sidebar-note">${esc(t)}</p>`).join('')}<p class="sidebar-note">${esc(s.sidebarNote)}</p></div></aside></div>`;
    setupExperiments();
  }
  function renderNotes() {
    app.innerHTML=pageLead('Writing / Archive','Notes','읽고, 유도하고, 실험하며 정리한 학습 기록입니다. 실제 글의 제목과 본문은 한국어로 작성합니다.') + `<div class="page-main"><div class="notes-controls"><input id="notes-search" class="search" type="search" value="${esc(notesQuery)}" placeholder="Search notes / 제목, 태그, 본문 검색" aria-label="Search notes">${filtersHtml(notesFilter)}<p class="editor-status" id="notes-count"></p></div><div id="notes-results"></div></div>`;
    updateNotesResults();
  }
  function updateNotesResults() {
    const box=$('notes-results'); if(!box) return;
    const q=notesQuery.trim().toLocaleLowerCase();
    const found=publicNotes().filter(n=>(notesFilter==='all'||n.category===notesFilter)&&(!q||[n.title,n.summary,n.body,...normalizeTags(n.tags),labels[n.category]].join(' ').toLocaleLowerCase().includes(q)));
    box.innerHTML=noteRows(found);
    $('notes-count').textContent=`${found.length} note${found.length===1?'':'s'} · ${publicNotes().length} total`;
  }
  function inlineMd(raw) {
    const code=[];
    let s=esc(raw).replace(/`([^`\n]+)`/g,(_,c)=>{code.push(`<code>${c}</code>`);return `⟦CODE${code.length-1}⟧`;});
    s=s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,(_full,alt,url)=>`<img loading="lazy" src="${esc(mediaUrl(url))}" alt="${alt}" class="article-img">`);
    s=s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(_full,label,url)=>`<a href="${esc(safeUrl(url))}" target="${url.startsWith('#')?'_self':'_blank'}" rel="noopener noreferrer">${label}</a>`);
    s=s.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
    s=s.replace(/\$([^$\n]+)\$/g,(_full,expr)=>`\\(${expr}\\)`);
    return s.replace(/⟦CODE(\d+)⟧/g,(_,i)=>code[Number(i)]||'');
  }
  function markdown(body) {
    const lines=String(body||'').replace(/\r\n/g,'\n').split('\n');
    const headings=[]; let html='', para=[], list=[], listType='ul';
    const flushPara=()=>{if(para.length){html+=`<p>${inlineMd(para.join(' '))}</p>`;para=[];}};
    const flushList=()=>{if(list.length){html+=`<${listType}>${list.map(x=>`<li>${inlineMd(x)}</li>`).join('')}</${listType}>`;list=[];}};
    for(let i=0;i<lines.length;i++) {
      const raw=lines[i], s=raw.trim();
      if(/^```/.test(s)) {
        flushPara();flushList();const lang=s.slice(3).trim().replace(/[^a-z0-9-]/gi,'');const code=[];
        while(i+1<lines.length&&!/^```/.test(lines[i+1].trim()))code.push(lines[++i]);
        if(i+1<lines.length)i++;
        html+=`<pre><code class="language-${lang}">${esc(code.join('\n'))}</code></pre>`;continue;
      }
      if(s.includes('$$')) {
        // Display-math delimiters can be next to explanatory prose. Split the
        // prose out before sending only the equation to MathJax.
        const marker=s.indexOf('$$');
        const leading=s.slice(0,marker).trim();
        flushPara();flushList();
        if(leading)html+=`<p>${inlineMd(leading)}</p>`;
        const math=[];let trailing='';
        const open=s.slice(marker+2), inlineEnd=open.indexOf('$$');
        if(inlineEnd!==-1){math.push(open.slice(0,inlineEnd));trailing=open.slice(inlineEnd+2).trim();}
        else {
          if(open)math.push(open);
          while(i+1<lines.length){
            const line=lines[++i],end=line.indexOf('$$');
            if(end!==-1){math.push(line.slice(0,end));trailing=line.slice(end+2).trim();break;}
            math.push(line);
          }
        }
        html+=`<div class="math-block">\\[${esc(math.join('\n').trim())}\\]</div>`;
        if(trailing)para.push(trailing);
        continue;
      }
      if(!s){flushPara();flushList();continue;}
      const heading=s.match(/^(#{1,4})\s+(.+)$/);
      if(heading){flushPara();flushList();const level=Math.max(2,heading[1].length);const id=`section-${headings.length+1}`;headings.push({level,title:heading[2],id});html+=`<h${level} id="${id}">${inlineMd(heading[2])}</h${level}>`;continue;}
      if(s==='---'||s==='***'){flushPara();flushList();html+='<hr>';continue;}
      if(/^\[demo:normal-kl\]$/i.test(s)){flushPara();flushList();html+=experimentHtml('article');continue;}
      const ul=s.match(/^[-*]\s+(.+)$/),ol=s.match(/^\d+\.\s+(.+)$/);
      if(ul||ol){flushPara();const type=ul?'ul':'ol';if(list.length&&type!==listType)flushList();listType=type;list.push((ul||ol)[1]);continue;}
      if(s.startsWith('>')){flushPara();flushList();const quote=[];while(i<lines.length&&lines[i].trim().startsWith('>')){quote.push(lines[i].trim().replace(/^>\s?/,''));i++;}i--;html+=`<blockquote><p>${inlineMd(quote.join(' '))}</p></blockquote>`;continue;}
      if(/^\|.+\|$/.test(s) && i+1<lines.length && /^\|?\s*:?-+:?\s*\|/.test(lines[i+1].trim())){
        flushPara();flushList();const cell=text=>text.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>inlineMd(x.trim()));
        const header=cell(s);i+=2;const rows=[];
        for(;i<lines.length&&/^\|.*\|$/.test(lines[i].trim());i++)rows.push(cell(lines[i]));i--;
        html+=`<table><thead><tr>${header.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;continue;
      }
      flushList();para.push(s);
    }
    flushPara();flushList();
    return {html,headings};
  }
  function latex(scope) {
    if(!window.MathJax?.typesetPromise) return;
    try { window.MathJax.typesetPromise([scope]).catch(()=>{}); } catch {}
  }
  function renderArticle(slug) {
    const n=noteBySlug(slug);
    if(!n || (n.draft && !local.notes[slug])) { app.innerHTML=pageLead('404 / Note not found','글을 찾을 수 없습니다.','비공개 초안이거나 존재하지 않는 게시글입니다.')+'<div class="page-main"><a href="#/notes" class="small-link">← Notes</a></div>';return; }
    const contents=markdown(n.body);const reading=Math.max(1,Math.ceil(String(n.body||'').length/750));
    app.innerHTML=`<div class="article-header"><div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/notes">Notes</a><span>/</span><span>${esc(labels[n.category]||n.category)}</span></div><h1 class="post-title">${esc(n.title)}</h1><p class="article-deck">${esc(n.summary)}</p><div class="article-meta"><span>${esc(n.date||'Undated')}</span><span>${esc(labels[n.category]||'Study Note')}</span><span>~${reading} min read</span>${n.localEdit?'<span class="local-mark">Local preview</span>':''}${n.draft?'<span class="draft-indicator">Draft</span>':''}${n.sample?'<span class="sample-label">Sample content</span>':''}</div></div>
      <div class="article-shell"><article class="article-content" id="rendered-markdown">${n.sample?'<div class="notice"><strong>Sample note.</strong> 디자인과 동작 확인을 위한 예시 글입니다. 실제 작성한 글로 바꿔 주세요.</div>':''}${n.localEdit?'<div class="notice">이 글의 수정 내용은 현재 브라우저에만 저장되어 있습니다. GitHub에 게시되지 않았습니다.</div>':''}${contents.html}</article>
      <aside class="article-aside"><h3>On this page</h3><nav>${contents.headings.filter(x=>x.level<=3).map(h=>`<a href="#${h.id}" data-anchor="${h.id}">${esc(h.title)}</a>`).join('')||'<span class="faint" style="font-size:12px">No headings</span>'}</nav><div class="article-side-actions"><a href="#/studio/edit/${encodeURIComponent(n.slug)}">Edit locally ↗</a><a href="#/notes">← All notes</a><button type="button" class="link-button quiet" data-action="copy-link">Copy note link</button></div></aside></div>`;
    setupExperiments();latex($('rendered-markdown'));
  }
  function renderProjects() {
    app.innerHTML=pageLead('Work / Portfolio','Projects','직접 구현한 모델, 실험, 시각화 프로젝트를 모아 두는 공간입니다. 처음 제공되는 항목은 예시이므로 나중에 교체할 수 있습니다.')+`<div class="page-main"><div class="project-list">${projectRows(false)}</div><p class="editor-guidance" style="margin-top:25px">Projects can be edited in Pages CMS → Projects, or <a href="#/studio/projects" class="small-link">locally in Studio ↗</a>.</p></div>`;
  }
  function renderExperiments() {
    app.innerHTML=pageLead('Interactive Notes','Experiments','이론의 수식과 그래프를 직접 조작하면서 관찰하는 공간입니다. 시각화는 기존 공부 글에서도 불러올 수 있습니다.')+`<div class="page-main" style="max-width:750px"><span class="overline">01 / Probability</span><h2 style="margin-bottom:12px">Comparing Normal Distributions</h2><p class="explain">고정된 표준정규분포 p(x)와 움직이는 정규분포 q(x)를 비교해보세요.</p>${experimentHtml('experiments')}<div class="notice" style="margin-top:24px">글 본문에서 <code>[demo:normal-kl]</code>라고 작성하면 같은 인터랙티브 실험을 삽입할 수 있습니다. 다른 그래프는 이후에 추가할 수 있습니다.</div></div>`;
    setupExperiments();
  }
  function renderAbout() {
    const s=site();
    app.innerHTML=pageLead('Personal / Introduction','About','')+`<div class="page-main" style="max-width:720px"><h2 style="margin-bottom:19px">Introduction</h2><p class="about-copy">${esc(s.about)}</p><h2 style="margin:47px 0 20px">Research Interests</h2><div class="pill-group">${normalizeTags(s.interests).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div><h2 style="margin:45px 0 20px">Currently Studying</h2><p class="about-copy">${esc(s.currentlyStudying)}</p><div class="action-row" style="margin-top:46px">${s.githubUrl?`<a href="${esc(safeUrl(s.githubUrl))}" target="_blank" rel="noopener noreferrer" class="link-button quiet">GitHub ↗</a>`:''}${s.contactEmail?`<a href="mailto:${esc(s.contactEmail)}" class="link-button quiet">Email ↗</a>`:''}<a href="#/studio/settings" class="link-button">Edit introduction locally ↗</a></div></div>`;
  }
  const studioBanner=()=>`<div class="studio-banner"><strong>Local Studio / Preview mode</strong> — 이 화면에서 작성한 글과 설정은 현재 브라우저에만 저장됩니다. 아직 외부에 게시되지 않으며, 로그인이 필요한 실제 온라인 편집은 <a href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">Pages CMS ↗</a>로 연결한 후 사용합니다. ${!persistent?'※ 이 브라우저는 로컬 저장을 허용하지 않습니다.':''}</div>`;
  function renderStudio() {
    const notes=allNotes();
    app.innerHTML=pageLead('Author area','Writing Studio','새 글을 쓰고, 기존 글을 고치고, 미리 볼 수 있습니다. 실제 공개 배포는 GitHub 연결 이후 가능합니다.')+`<div class="studio-surface">${studioBanner()}
      <div class="studio-actions"><button data-action="new" class="link-button primary">+ New note</button><a href="#/studio/settings" class="link-button">Edit homepage</a><a href="#/studio/projects" class="link-button">Manage projects</a><a href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer" class="link-button quiet">Open Pages CMS ↗</a><button class="link-button quiet" data-action="export-backup">Download local backup</button><label class="link-button quiet" style="cursor:pointer">Restore backup<input id="import-backup" type="file" accept="application/json,.json" hidden></label></div>
      <div class="studio-layout"><div><div class="section-heading"><h2>All Notes <small class="faint" style="font-weight:450;font-size:12px">(${notes.length})</small></h2><span class="sample-label">Editable preview</span></div><div class="studio-list">${notes.map(n=>`<div class="studio-item"><div><h3>${esc(n.title||'제목 없는 글')}</h3><p>${esc(n.date||'')} · ${esc(labels[n.category]||n.category)} · ${n.draft?'<span class="draft-indicator">Draft</span>':'Published in preview'}${n.sample?' · Sample':''}${n.localEdit?' · Local changes':''}</p></div><div class="action-row"><a class="link-button quiet" href="#/studio/edit/${encodeURIComponent(n.slug)}">Edit</a><a class="link-button quiet" href="#/notes/${encodeURIComponent(n.slug)}">View</a></div></div>`).join('')||'<p class="studio-empty">아직 작성한 글이 없습니다.</p>'}</div>
      <div class="action-row" style="margin-top:28px"><button class="link-button quiet" data-action="export-all-md">Export my local .md files</button><button class="link-button quiet" data-action="export-images">Download local images</button><button class="link-button danger" data-action="reset-local">Clear local changes</button></div></div>
      <aside class="studio-side"><h3>Publishing workflow</h3><p><strong>01.</strong> Write and check a note here.</p><p><strong>02.</strong> Export the Markdown file or copy its content.</p><p><strong>03.</strong> Connect your GitHub repository to <a href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">Pages CMS</a> to publish directly.</p><p><strong>04.</strong> GitHub Actions rebuilds the public website automatically.</p><hr><h3>Supported content</h3><p>Markdown · LaTeX · fenced code · images · tables · tags · draft / published · local backup · interactive demos</p></aside></div></div>`;
  }
  const dateNow=()=>new Date().toISOString().slice(0,10);
  function generateNewSlug(){let slug='new-note';let i=1;while(noteBySlug(slug)){slug=`new-note-${i++}`;}return slug;}
  function createNote() {
    const slug=generateNewSlug();
    local.notes[slug]={slug,title:'',date:dateNow(),category:'probability',summary:'',tags:[],draft:true,sample:false,body:'## 첫 번째 소제목\n\n여기에 글을 작성하세요.\n\n$$\np(x) = \\int p(x,z)\\,dz\n$$',source:'local'};
    if(saveLocal())go('/studio/edit/'+slug);
  }
  function field(id,label,value,opts={}) {
    if(opts.textarea)return `<label class="editor-field"><span>${esc(label)}</span><textarea id="${id}" ${opts.rows?`rows="${opts.rows}"`:''}>${esc(value)}</textarea></label>`;
    return `<label class="editor-field"><span>${esc(label)}</span><input id="${id}" type="${opts.type||'text'}" ${opts.required?'required':''} value="${esc(value)}"></label>`;
  }
  function readEditor() {
    return {slug:($('field-slug')?.value||'').trim(),title:($('field-title')?.value||'').trim(),date:($('field-date')?.value||'').trim(),category:($('field-category')?.value||'probability'),summary:($('field-summary')?.value||'').trim(),tags:normalizeTags($('field-tags')?.value||''),draft:true,sample:false,body:$('field-body')?.value||'',source:'local'};
  }
  function renderEditor(slug) {
    const n=noteBySlug(slug);
    if(!n) {go('/studio');return;}
    lastEditorSlug=slug;
    app.innerHTML=`<div class="editor-top"><span class="overline">Writing Studio / Editor</span><h1>${n.title?`Edit: ${esc(n.title)}`:'New note'}</h1><p class="editor-guidance">작성 내용은 이 브라우저에 자동으로 임시 저장됩니다. <strong>Publish locally</strong>는 인터넷에 공개하지 않습니다.</p><div class="editor-actions"><a href="#/studio" class="link-button quiet">← All notes</a><button class="link-button" data-action="save-draft">Save draft</button><button class="link-button primary" data-action="publish-local">Publish locally</button><a class="link-button quiet" href="https://app.pagescms.org/" target="_blank" rel="noopener noreferrer">Publish online ↗</a><button class="link-button quiet" data-action="export-md">Export .md</button><button class="link-button danger" data-action="delete-note">Delete</button></div></div>
    <div class="editor-layout"><div class="editor-panel"><h2>Content</h2><div class="editor-status" id="save-status">${n.localEdit?'Local changes saved':'Source note — edits will be stored locally'}</div>
      ${field('field-title','Title / 한국어 제목',n.title,{required:true})}
      <div class="form-grid">${field('field-slug','Slug / 영문 주소',n.slug,{required:true})}${field('field-date','Date',n.date||dateNow(),{type:'date'})}</div>
      <div class="form-grid"><label class="editor-field"><span>Category</span><select id="field-category">${CATEGORIES.slice(1).map(cat=>`<option value="${cat.id}" ${n.category===cat.id?'selected':''}>${cat.label}</option>`).join('')}</select></label>${field('field-tags','Tags / comma-separated',normalizeTags(n.tags).join(', '))}</div>
      ${field('field-summary','Summary / 글 목록 요약',n.summary,{textarea:true,rows:2})}
      <div class="editor-toolbar"><span class="muted" style="font-size:12px;font-weight:600">Body / Markdown</span><div class="action-row"><button type="button" data-insert="heading">H2</button><button type="button" data-insert="bold">B</button><button type="button" data-insert="inline-math" title="문장 안에 수식 넣기">$x$</button><button type="button" data-insert="math" title="독립된 수식 넣기">∑ Block</button><button type="button" data-insert="code">&lt;/&gt;</button><button type="button" data-action="insert-image">Image</button></div></div>
      <textarea id="field-body" class="editor-textarea" spellcheck="false" aria-label="Markdown article body">${esc(n.body)}</textarea><input id="inline-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><p class="editor-guidance">예: <code>## 제목</code>, <code>**굵게**</code>, <code>$x^2$</code> (문장 중간), <code>$$ ... $$</code> (독립 수식, 위아래 선 없음), <code>[demo:normal-kl]</code>. 이미지 파일은 임시로 저장되며 온라인 발행할 때 함께 업로드해야 합니다.</p>
    </div><div class="editor-panel preview-panel"><h2>Live Preview</h2><p class="editor-status">이 영역은 본문을 실시간으로 미리 보여줍니다.</p><article class="article-content" id="editor-preview"></article></div></div>`;
    updateEditorPreview();
  }
  function updateEditorPreview(){const el=$('editor-preview');if(!el)return;const body=$('field-body').value; if(window.MathJax?.typesetClear) try{MathJax.typesetClear([el]);}catch{} el.innerHTML=markdown(body).html||'<p class="faint">오른쪽에서 미리 보세요. 글을 작성하면 이곳에 나타납니다.</p>';setupExperiments(el);window.setTimeout(()=>{if($('editor-preview')===el)latex(el);},70);}
  function storeEditor(draft,quiet=false) {
    if(!$('field-body'))return false;
    const obj=readEditor();
    if(!obj.title) {if(!quiet)toast('먼저 제목을 입력해 주세요.');return false;}
    if(!/^[a-z0-9-]+$/.test(obj.slug)){if(!quiet)toast('Slug는 영문 소문자, 숫자, 하이픈만 사용하세요.');return false;}
    if(obj.slug!==lastEditorSlug && noteBySlug(obj.slug)){if(!quiet)toast('이미 존재하는 Slug입니다.');return false;}
    obj.draft=draft;
    if(obj.slug!==lastEditorSlug){local.deleted=local.deleted.filter(s=>s!==obj.slug);delete local.notes[lastEditorSlug];if(DATA.notes.some(x=>x.slug===lastEditorSlug))local.deleted.push(lastEditorSlug);}
    local.notes[obj.slug]=obj;
    const okay=saveLocal();
    if(!okay)return false;
    if(!quiet)toast(obj.draft?'Draft saved locally.':'Published in this browser only.');
    if($('save-status'))$('save-status').textContent=(obj.draft?'Draft':'Local published')+' · Saved to this browser '+new Date().toLocaleTimeString();
    lastEditorSlug=obj.slug;
    return obj;
  }
  function autosave(){clearTimeout(editorTimer);editorTimer=window.setTimeout(()=>{const old=noteBySlug(lastEditorSlug);storeEditor(old?.draft!==false,true);},900);}
  function renderSettings() {
    const s=site();
    app.innerHTML=pageLead('Writing Studio / Settings','Edit homepage','소개 문구와 홈페이지 사진을 수정합니다. 변경 사항은 온라인 사이트가 아니라 지금 사용 중인 브라우저에만 반영됩니다.')+`<div class="settings-layout">${studioBanner()}
      <div class="editor-actions" style="margin:22px 0 29px"><button data-action="save-settings" class="link-button primary">Save locally</button><button data-action="export-settings" class="link-button quiet">Export site.json</button><a href="#/" class="link-button quiet">Preview homepage ↗</a></div>
      <div class="form-grid">${field('setting-name','Site name',s.siteName)}${field('setting-label','Intro label',s.introLabel)}</div>
      ${field('setting-title','Homepage heading / 줄바꿈 가능',s.introTitle,{textarea:true,rows:2})}
      ${field('setting-description','Intro description',s.introDescription,{textarea:true,rows:4})}
      ${field('setting-interests','Interests / comma-separated',s.interests)}
      ${field('setting-about','About',s.about,{textarea:true,rows:4})}
      ${field('setting-studying','Currently studying / comma-separated',s.currentlyStudying)}
      ${field('setting-side','Sidebar note',s.sidebarNote,{textarea:true,rows:2})}
      <div class="form-grid">${field('setting-github','GitHub URL',s.githubUrl)}${field('setting-email','Contact email',s.contactEmail)}</div>
      <h2 style="margin:28px 0 12px;font-size:17px">Homepage image</h2><p class="editor-guidance">현재 사진은 임시 이미지입니다. 사진을 교체하면 이 브라우저에서만 보입니다. 공개하려면 Pages CMS의 <strong>Home image</strong>에서 같은 사진을 업로드하세요.</p>
      <img class="settings-photo" id="settings-photo" src="${esc(mediaUrl(local.site.heroImageData||s.heroImage))}" alt="홈페이지 이미지 미리보기">
      <label class="editor-field"><span>Replace image</span><input type="file" id="setting-photo" accept="image/jpeg,image/png,image/webp"></label>
      ${field('setting-hero-alt','Image alt text',s.heroAlt)}
      <p class="editor-guidance">출처 파일 <code>data/site.json</code>은 직접 수정하거나 Pages CMS 관리자 화면에서 수정할 수 있습니다. 로컬 변경은 Export로 백업해 주세요.</p>
      <div class="action-row" style="margin-top:26px"><button data-action="save-settings" class="link-button primary">Save locally</button><button data-action="export-settings" class="link-button quiet">Export site.json</button><button data-action="export-photo" class="link-button quiet">Download replacement photo</button></div>
    </div>`;
  }
  function renderProjectSettings() {
    const projects=currentProjects();
    const fields=projects.map((p,i)=>`<div class="project-form" data-project-form="${i}" style="border-top:1px solid var(--line);padding:25px 0 15px"><div class="section-heading"><h2 style="font-size:16px">Project ${i+1}</h2><button type="button" data-action="remove-project" data-index="${i}" class="link-button danger">Delete</button></div>${field(`project-${i}-title`,'Project title',p.title)}${field(`project-${i}-desc`,'Description',p.description,{textarea:true,rows:3})}<div class="form-grid">${field(`project-${i}-stack`,'Stack / tools',p.stack)}${field(`project-${i}-url`,'URL (optional)',p.url||'')}</div><label class="editor-field" style="display:flex;align-items:center;gap:9px"><input type="checkbox" id="project-${i}-sample" style="width:auto" ${p.sample?'checked':''}><span style="margin-bottom:0">Show Sample label</span></label></div>`).join('');
    app.innerHTML=pageLead('Writing Studio / Portfolio','Edit projects','프로젝트 제목·설명·GitHub 링크를 추가하고 관리합니다. 로컬 수정이며 온라인 변경에는 CMS 연동이 필요합니다.')+`<div class="settings-layout">${studioBanner()}<div class="action-row" style="margin:21px 0 29px"><button class="link-button primary" data-action="save-projects">Save locally</button><button class="link-button" data-action="add-project">+ Add project</button><button class="link-button quiet" data-action="export-projects">Export projects.json</button><a href="#/studio" class="link-button quiet">← Studio</a></div><div id="project-settings-list">${fields}</div><div class="action-row" style="margin-top:17px"><button class="link-button primary" data-action="save-projects">Save locally</button></div></div>`;
  }
  function readProjectSettings() {
    return [...document.querySelectorAll('[data-project-form]')].map((el,i)=>({title:el.querySelector(`#project-${i}-title`)?.value||'',description:el.querySelector(`#project-${i}-desc`)?.value||'',stack:el.querySelector(`#project-${i}-stack`)?.value||'',url:el.querySelector(`#project-${i}-url`)?.value||'',sample:!!el.querySelector(`#project-${i}-sample`)?.checked}));
  }
  function readSettings() {
    return {siteName:$('setting-name').value, introLabel:$('setting-label').value, introTitle:$('setting-title').value, introDescription:$('setting-description').value, interests:$('setting-interests').value, about:$('setting-about').value, currentlyStudying:$('setting-studying').value, sidebarNote:$('setting-side').value, githubUrl:$('setting-github').value, contactEmail:$('setting-email').value, heroAlt:$('setting-hero-alt').value};
  }
  function siteJson(){const s={...DATA.site,...local.site};delete s.heroImageData;return s;}
  function downloadFile(filename,content,mime='text/plain;charset=utf-8'){
    const blob=content instanceof Blob?content:new Blob([content],{type:mime});
    const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function yamlString(x){return JSON.stringify(String(x ?? ''));}
  function noteMarkdown(n) {
    const fm=[['slug',n.slug],['title',n.title],['date',n.date],['category',n.category],['summary',n.summary],['tags',normalizeTags(n.tags).join(', ')]].map(([k,v])=>`${k}: ${yamlString(v)}`);
    return `---\n${fm.join('\n')}\ndraft: ${n.draft===true}\nsample: false\n---\n\n${n.body||''}\n`;
  }
  function downloadMD(slug){const n=noteBySlug(slug);if(!n){toast('글을 찾을 수 없습니다.');return;} downloadFile(`${n.slug}.md`,noteMarkdown(n),'text/markdown;charset=utf-8');toast('Markdown 파일을 내려받았습니다. 실제 게시하려면 CMS에 저장하세요.');}
  async function compressImage(file, size=1000) {
    if(!file.type.startsWith('image/'))throw new Error('Not an image');
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,size/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    return canvas.toDataURL('image/webp',.78);
  }
  function insertAtCursor(text) {
    const input=$('field-body');if(!input)return;
    const a=input.selectionStart,b=input.selectionEnd;const val=input.value;input.value=val.slice(0,a)+text+val.slice(b);input.focus();input.setSelectionRange(a+text.length,a+text.length);updateEditorPreview();autosave();
  }
  function dataUriToBlob(data){const [h,b64]=data.split(',');const mime=h.match(/data:(.*?);base64/)?.[1]||'image/webp';const raw=atob(b64);const arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);return new Blob([arr],{type:mime});}
  async function readFileAsText(file){return await file.text();}
  function render() {
    clearTimeout(editorTimer);
    const path=route();renderNav(path);
    if(path==='/')renderHome();
    else if(path==='/notes')renderNotes();
    else if(path.startsWith('/notes/'))renderArticle(path.slice(7));
    else if(path==='/projects')renderProjects();
    else if(path==='/experiments')renderExperiments();
    else if(path==='/about')renderAbout();
    else if(path==='/studio')renderStudio();
    else if(path.startsWith('/studio/edit/'))renderEditor(path.slice(13));
    else if(path==='/studio/settings')renderSettings();
    else if(path==='/studio/projects')renderProjectSettings();
    else app.innerHTML=pageLead('Not found','404','해당 페이지를 찾을 수 없습니다.')+'<div class="page-main"><a href="#/" class="small-link">Home ↗</a></div>';
    window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',async event=>{
    const anchor=event.target.closest('[data-anchor]');
    if(anchor){event.preventDefault();$(anchor.dataset.anchor)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const filter=event.target.closest('button[data-filter]');
    if(filter){notesFilter=filter.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));if($('notes-results'))updateNotesResults();if($('home-note-list'))$('home-note-list').innerHTML=noteRows(publicNotes().filter(n=>notesFilter==='all'||n.category===notesFilter).slice(0,4));return;}
    const insert=event.target.closest('[data-insert]');
    if(insert){const snippets={heading:'\n## 새 소제목\n\n',bold:'**강조할 내용**','inline-math':'$X \sim N(\mu, \sigma^2)$',math:'\n$$\n\\mathcal{L}(q) = \\mathbb{E}_q[\\log p(x,z)] - \\mathbb{E}_q[\\log q(z)]\n$$\n',code:'\n```python\nimport numpy as np\n```\n'};insertAtCursor(snippets[insert.dataset.insert]||'');return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(!action)return;
    if(action==='new'){createNote();return;}
    if(action==='save-draft'){clearTimeout(editorTimer);if(storeEditor(true))go('/studio');return;}
    if(action==='publish-local'){clearTimeout(editorTimer);const obj=storeEditor(false);if(obj)go('/notes/'+obj.slug);return;}
    if(action==='delete-note'){
      if(!confirm('이 글을 이 브라우저에서 삭제할까요? GitHub 저장소의 원본에는 영향이 없습니다.'))return;
      const slug=lastEditorSlug;delete local.notes[slug];if(DATA.notes.some(x=>x.slug===slug)&&!local.deleted.includes(slug))local.deleted.push(slug);saveLocal();go('/studio');toast('Local note removed.');return;
    }
    if(action==='export-md'){const obj=storeEditor(noteBySlug(lastEditorSlug)?.draft!==false);if(obj)downloadMD(obj.slug);return;}
    if(action==='copy-link'){
      const link=location.href;
      try{await navigator.clipboard.writeText(link);toast('글 주소를 복사했습니다.');}catch{toast('주소창의 URL을 복사해 주세요.');}return;
    }
    if(action==='save-settings'){
      local.site={...local.site,...readSettings()};if(saveLocal())toast('홈페이지 설정을 이 브라우저에 저장했습니다.');return;
    }
    if(action==='export-settings'){
      local.site={...local.site,...readSettings()};saveLocal();downloadFile('site.json',JSON.stringify(siteJson(),null,2),'application/json');toast('site.json 내려받기 완료. 업로드 사진은 따로 저장하세요.');return;
    }
    if(action==='export-photo'){
      const img=local.site.heroImageData;if(!img){toast('새로 업로드한 사진이 없습니다.');return;}downloadFile('hero-photo.webp',dataUriToBlob(img));return;
    }
    if(action==='insert-image'){$('inline-image-file')?.click();return;}
    if(action==='export-backup'){
      downloadFile('academic-notes-local-backup.json',JSON.stringify({exportedAt:new Date().toISOString(),kind:'academic-notes-studio',local},null,2),'application/json');toast('백업을 다운로드했습니다.');return;
    }
    if(action==='export-all-md'){
      const entries=Object.values(local.notes);if(!entries.length){toast('로컬에서 수정한 글이 없습니다.');return;}
      for (let i=0;i<entries.length;i++)setTimeout(()=>downloadMD(entries[i].slug),i*400);
      toast('각 .md 파일을 다운로드합니다. 팝업 차단을 허용해야 할 수 있습니다.');return;
    }
    if(action==='save-projects'){local.projects=readProjectSettings();if(saveLocal())toast('프로젝트 변경 사항을 이 브라우저에 저장했습니다.');return;}
    if(action==='add-project'){local.projects=[...readProjectSettings(),{title:'',description:'',stack:'',url:'',sample:false}];if(saveLocal())renderProjectSettings();return;}
    if(action==='remove-project'){if(!confirm('이 프로젝트를 로컬 목록에서 삭제할까요?'))return;const items=readProjectSettings();items.splice(Number(event.target.closest('[data-index]').dataset.index),1);local.projects=items;if(saveLocal())renderProjectSettings();return;}
    if(action==='export-projects'){local.projects=readProjectSettings();saveLocal();downloadFile('projects.json',JSON.stringify(currentProjects(),null,2),'application/json');toast('projects.json 다운로드 완료');return;}
    if(action==='export-images'){
      const images=Object.entries(local.images);
      if(!images.length){toast('로컬에서 업로드한 이미지가 없습니다.');return;}
      images.forEach(([path,data],i)=>setTimeout(()=>downloadFile(path.split('/').pop(),dataUriToBlob(data)),i*420));
      toast('이미지 파일을 내려받습니다. CMS에서 assets/ 폴더에 업로드하세요.');return;
    }
    if(action==='reset-local'){
      if(!confirm('이 브라우저의 모든 변경·사진·새 글을 삭제할까요? 삭제 후 복구할 수 없으므로 먼저 백업하세요.'))return;
      local=emptyLocal();saveLocal();go('/studio');toast('Local changes cleared.');return;
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='notes-search'){notesQuery=event.target.value;updateNotesResults();}
    if(event.target.closest('.editor-panel') && event.target.matches('input,textarea,select')){
      if(event.target.id==='field-body'){clearTimeout(window.previewTimer);window.previewTimer=setTimeout(updateEditorPreview,210);}
      autosave();
    }
  });
  document.addEventListener('change',async event=>{
    if(event.target.id==='inline-image-file' && event.target.files?.length){
      try{
        const file=event.target.files[0];const data=await compressImage(file,900);
        const name='note-'+Date.now().toString(36)+'.webp';const key='assets/'+name;
        local.images[key]=data;
        if(!saveLocal()){delete local.images[key];return;}
        insertAtCursor(`\n![${file.name.replace(/[\[\]()]/g,'')}](${key})\n`);
        toast('이미지를 로컬에 추가했습니다. 온라인 게시 시 이미지 파일도 업로드하세요.');
      }catch(err){toast('이미지를 불러오지 못했습니다. '+err.message);}return;
    }
    if(event.target.id==='setting-photo' && event.target.files?.length){
      try{local.site.heroImageData=await compressImage(event.target.files[0],1000);if(saveLocal()){$('settings-photo').src=local.site.heroImageData;toast('새 사진을 이 브라우저에 저장했습니다.');}}catch(err){toast('사진 처리 중 오류: '+err.message);}return;
    }
    if(event.target.id==='import-backup' && event.target.files?.length){
      try{const parsed=JSON.parse(await readFileAsText(event.target.files[0]));if(parsed.kind!=='academic-notes-studio'||!parsed.local?.notes)throw new Error('사이트 백업 형식이 아닙니다.');if(!confirm('현재 로컬 작업 내역을 백업 내용으로 덮어쓸까요?'))return;local={...emptyLocal(),...parsed.local};if(saveLocal()){render();toast('백업을 복원했습니다.');}}catch(err){toast('백업 복원 실패: '+err.message);}return;
    }
  });
  document.addEventListener('keydown',event=>{
    if((event.metaKey||event.ctrlKey)&&event.key==='s'&&$('field-body')){event.preventDefault();clearTimeout(editorTimer);storeEditor(noteBySlug(lastEditorSlug)?.draft!==false);}
  });
  window.addEventListener('hashchange',render);
  render();
})();
