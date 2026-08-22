/* ===== Match Studio 官网脚本 ===== */
(function () {
  'use strict';

  /* ------------------------------------------------------------
   * Airtable 数据层
   * - Base：Match Studio｜Business OS（appNw0RvbOkZByR62）
   * - 填好 PAT 后，站点内容会从 Airtable 拉取并覆盖下方 FALLBACK
   * - 字段映射（按底稿 5 表 MVP）：
   *    案例 / 能力  → 表「Cases & Capabilities」
   *      字段：Name(名称) / Industry(行业) / Market(市场) / ContentType(内容类型)
   *            Stat(数据) / Pitch(说明) / Hero(图) / PublicLevel(公开等级 P0-P3)
   *    团队        → 表「Team」
   *      字段：Name / Role(角色) / Bio(简介) / Photo(照片)
   * ------------------------------------------------------------ */
  const AIRTABLE = {
    BASE_ID: 'appNw0RvbOkZByR62',
    PAT: '', // ← 填入你的 Airtable Personal Access Token（只读即可）
    TABLES: { cases: 'Cases & Capabilities', team: 'Team' }
  };

  /* ---------- 兜底内容（当前设计稿） ---------- */
  const FALLBACK = {
    cases: [
      { id: 'MS-CA-001', name: 'Luckin Coffee', nameCn: '瑞幸', tag: 'COFFEE', title: '第 30000 家门店 · 印尼寻豆之旅', stat: '8.1M 播放', gradient: 'linear-gradient(180deg, #29140d, #d98424)' },
      { id: 'MS-CA-002', name: 'HUAWEI', nameCn: '华为', tag: 'TECH', title: 'Mate 80 旗舰 TVC', stat: '21.3M 播放', gradient: 'linear-gradient(180deg, #1a0a0d, #d91f1f)' },
      { id: 'MS-CA-003', name: 'INTEL', nameCn: '英特尔', tag: 'SEMICONDUCTOR', title: '实拍 + AI 重绘', stat: '6.7M 播放', gradient: 'linear-gradient(180deg, #081426, #1a73e6)' },
      { id: 'MS-CA-004', name: 'JD.com', nameCn: '京东', tag: 'E-COMMERCE', title: '《江燕》品牌片', stat: '15.2M 播放', gradient: 'linear-gradient(180deg, #260d05, #e6401a)' }
    ],
    filters: ['全部', '消费电子', '电商', '汽车', '美妆', '餐饮'],
    stats: [
      { num: '13', label: '协作网络覆盖国家' },
      { num: '13', label: '协作网络覆盖城市' },
      { num: '15', label: '最多同步出发人数' },
      { num: '100+', label: '核心团队项目经验' }
    ],
    team: [
      { name: 'Lux', role: '创始人 · 项目负责人', desc: '10+ 年品牌营销与整合 Campaign，100+ 项目经验，常驻美国', photo: 'assets/team/lux.jpg' },
      { name: '廖阔', role: '全球拍摄与直播', desc: '十多年纪录片、宣传片、无人机与海外拍摄经验', photo: 'assets/team/liaokuo.jpg' },
      { name: '邦威', role: 'AI 导演 · 后期监制', desc: 'TVC、CG、特效、AI 视频导演与整体制作统筹', photo: 'assets/team/bangwei.jpg' },
      { name: '刘宸', role: '企业 AI 落地', desc: '工学博士、大数据科学家，企业 AI 培训与工作流共创', photo: 'assets/team/liuchen.jpg' }
    ],
    capabilities: [
      { title: '海外拍摄与直播', chips: ['现场执行', '发布会', '纪录片', '航拍'], gradient: 'linear-gradient(180deg, #0a1220, #14627a)' },
      { title: '品牌营销', chips: ['现场执行', '直播', '跨洲链路'], gradient: 'linear-gradient(180deg, #0a1a14, #147a5e)' },
      { title: '视频制作', chips: ['实拍', 'AIGC', '重绘', '创意导演'], gradient: 'linear-gradient(180deg, #140a22, #5a2a8a)' },
      { title: '企业培训与业务共创', chips: ['AI 认知', '数字员工', '工作流', '业务共创'], gradient: 'linear-gradient(180deg, #12140a, #6a7a14)' }
    ],
    europe: ['assets/europe/1.jpg', 'assets/europe/2.jpg', 'assets/europe/3.jpg', 'assets/europe/4.jpg'],
    briefChips: {
      business: ['电商零售', '消费电子', '美妆时尚', '汽车'],
      market: ['北美', '欧洲', '东南亚', '拉美'],
      content: ['客户故事', '活动纪实', 'AI 分版广告', '直播']
    }
  };

  let DATA = FALLBACK;

  /* ---------- 语言字典 ---------- */
  const I18N = {
    zh: {
      'nav.services': '服务', 'nav.cases': '案例', 'nav.team': '团队', 'nav.capabilities': '能力', 'nav.cta': '预约咨询',
      'hero.slogan': '让品牌在全球开机，让 AI 在业务里落地。',
      'hero.sub': '中国企业出海传播的全球内容制作与企业 AI 共创伙伴',
      'hero.cta': '预约咨询',
      'cases.eyebrow': '我们的作品', 'cases.title': '案例精选', 'cases.sub': '100+ 个出海案例，横滑浏览，喜欢就收藏。',
      'services.eyebrow': '出海服务', 'services.title': '全球现场与跨洲直播', 'services.sub': '13 国协作网络 · 从海外拍摄到跨洲直播的现场执行能力',
      'services.field.title': '海外拍摄', 'services.live.title': '跨洲直播',
      'team.eyebrow': '关于我们', 'team.title': '创始人 & 核心团队', 'team.sub': '一支有审美、懂叙事、能落地的出海内容与 AI 团队。',
      'brief.eyebrow': '发起项目', 'brief.title': '告诉我们你的需求', 'brief.sub': '六道题，帮你锁定第一版出海内容方案。',
      'brief.q1': '这是为哪个业务单元准备的？', 'brief.q2': '目标市场是哪里？', 'brief.q3': '需要什么类型的内容？',
      'brief.cta': '看看我们会怎么做',
      'concierge.eyebrow': 'AI 礼宾', 'concierge.title': '工作室礼宾',
      'concierge.msg1': '你收藏了 3 项能力。告诉我你的需求——行业、市场、想要什么内容。',
      'concierge.msg2': '消费电子 · 北美市场 · 一条 AI 分版广告片',
      'concierge.placeholder': '姓名和邮箱…',
      'capabilities.eyebrow': '能力矩阵', 'capabilities.title': '四种能力',
      'capabilities.sub': '海外拍摄与直播、品牌营销、视频制作、企业 AI 共创，一条出海链路全覆盖。',
      'footer.tagline': '中国企业出海的全球内容制作伙伴',
      'footer.col1': '工作室', 'footer.services': '服务', 'footer.cases': '案例',
      'footer.col2': '公司', 'footer.team': '团队', 'footer.contact': '联系',
      'footer.col3': '资源', 'footer.capabilities': '能力', 'footer.brief': '项目简报',
      'footer.made': '为中国企业出海而生'
    },
    en: {
      'nav.services': 'Services', 'nav.cases': 'Cases', 'nav.team': 'Team', 'nav.capabilities': 'Capabilities', 'nav.cta': 'Book a consult',
      'hero.slogan': 'Turn brands on globally. Put AI to work in business.',
      'hero.sub': 'Global content production & AI co-creation partner for outbound Chinese brands',
      'hero.cta': 'Book a consult',
      'cases.eyebrow': 'Our Work', 'cases.title': 'Selected Cases', 'cases.sub': '100+ outbound cases. Swipe to browse, save what you like.',
      'services.eyebrow': 'Outbound Services', 'services.title': 'Global Field & Cross-Continental Live', 'services.sub': '13-country network · on-the-ground execution from shoot to live',
      'services.field.title': 'Overseas Shoot', 'services.live.title': 'Cross-Continental Live',
      'team.eyebrow': 'About Us', 'team.title': 'Founder & Core Team', 'team.sub': 'A team with taste, story and delivery for outbound content & AI.',
      'brief.eyebrow': 'Start a Project', 'brief.title': 'Tell us about you', 'brief.sub': 'Six questions to lock your first outbound content plan.',
      'brief.q1': 'What part of the business is this for?', 'brief.q2': 'Which market are we shooting for?', 'brief.q3': 'What kind of content do you need?',
      'brief.cta': 'See what we\'d build',
      'concierge.eyebrow': 'AI Concierge', 'concierge.title': 'Studio concierge',
      'concierge.msg1': 'You shortlisted 3 capabilities. Tell me about your brief — industry, market, what you need.',
      'concierge.msg2': 'Consumer tech · North America · an AI-versioned ad',
      'concierge.placeholder': 'Name and email…',
      'capabilities.eyebrow': 'Capabilities', 'capabilities.title': 'Four Capabilities',
      'capabilities.sub': 'Field, Live, Story + AI, AI in Business — one outbound chain, full coverage.',
      'footer.tagline': 'Global content partner for outbound Chinese brands',
      'footer.col1': 'Studio', 'footer.services': 'Services', 'footer.cases': 'Cases',
      'footer.col2': 'Company', 'footer.team': 'Team', 'footer.contact': 'Contact',
      'footer.col3': 'Resources', 'footer.capabilities': 'Capabilities', 'footer.brief': 'Brief',
      'footer.made': 'Made for outbound Chinese brands'
    }
  };
  let lang = 'zh';

  /* ============================================================
   * 渲染函数
   * ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderCases() {
    const grid = document.getElementById('casesGrid');
    grid.innerHTML = '';
    DATA.cases.forEach(function (c) {
      const card = el('article', 'case-card');
      card.innerHTML =
        '<div class="case-img" style="background:' + c.gradient + '">' +
          '<span class="case-tag">' + c.tag + '</span>' +
        '</div>' +
        '<div class="case-body">' +
          '<div class="case-name">' + c.name + '</div>' +
          '<div class="case-name-cn">' + c.nameCn + '</div>' +
          '<div class="case-title">' + c.title + '</div>' +
          '<div class="case-stat">' + c.stat + '</div>' +
        '</div>';
      card.addEventListener('click', function () { openCaseModal(c); });
      grid.appendChild(card);
    });
  }

  function renderFilters() {
    const box = document.getElementById('filters');
    box.innerHTML = '';
    DATA.filters.forEach(function (f, i) {
      const b = el('button', 'filter-chip' + (i === 0 ? ' active' : ''), f);
      b.addEventListener('click', function () {
        box.querySelectorAll('.filter-chip').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
      box.appendChild(b);
    });
  }

  function renderStats() {
    const box = document.getElementById('stats');
    box.innerHTML = '';
    DATA.stats.forEach(function (s) {
      box.appendChild(el('div', 'stat', '<span class="stat-num">' + s.num + '</span><span class="stat-label">' + s.label + '</span>'));
    });
  }

  function renderTeam() {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = '';
    DATA.team.forEach(function (m) {
      const card = el('div', 'member-card');
      card.innerHTML =
        '<div class="member-photo"><img src="' + m.photo + '" alt="' + m.name + '" loading="lazy"></div>' +
        '<div class="member-body">' +
          '<div class="member-name">' + m.name + '</div>' +
          '<div class="member-role">' + m.role + '</div>' +
          '<div class="member-desc">' + m.desc + '</div>' +
        '</div>';
      grid.appendChild(card);
    });
  }

  function renderCapabilities() {
    const grid = document.getElementById('capGrid');
    grid.innerHTML = '';
    DATA.capabilities.forEach(function (c) {
      const card = el('div', 'cap-card');
      const chips = c.chips.map(function (k) { return '<span class="cap-chip">' + k + '</span>'; }).join('');
      card.innerHTML =
        '<div class="cap-img" style="background:' + c.gradient + '"></div>' +
        '<div class="cap-chips">' + chips + '</div>' +
        '<div class="cap-title">' + c.title + '</div>';
      grid.appendChild(card);
    });
  }

  function renderEurope() {
    const box = document.getElementById('europePhotos');
    box.innerHTML = '';
    DATA.europe.forEach(function (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '欧洲仓库';
      img.loading = 'lazy';
      box.appendChild(img);
    });
  }

  function renderBriefChips() {
    document.querySelectorAll('[data-chips]').forEach(function (group) {
      const key = group.getAttribute('data-chips');
      group.innerHTML = '';
      (DATA.briefChips[key] || []).forEach(function (label) {
        const b = el('button', 'chip', label);
        b.type = 'button';
        b.addEventListener('click', function () {
          group.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('selected'); });
          b.classList.add('selected');
        });
        group.appendChild(b);
      });
    });
  }

  function renderAll() {
    renderCases(); renderFilters(); renderStats(); renderTeam(); renderCapabilities(); renderEurope(); renderBriefChips();
  }

  /* ============================================================
   * 案例详情弹窗
   * ============================================================ */
  function openCaseModal(c) {
    let modal = document.getElementById('caseModal');
    if (!modal) {
      modal = el('div', 'case-modal');
      modal.id = 'caseModal';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    }
    modal.innerHTML =
      '<div class="case-modal-card">' +
        '<button class="modal-close" aria-label="关闭">×</button>' +
        '<div class="case-modal-img" style="background:' + c.gradient + '"></div>' +
        '<div class="case-modal-body">' +
          '<h3>' + c.name + ' · ' + c.nameCn + '</h3>' +
          '<p class="case-title">' + c.title + '</p>' +
          '<p class="case-stat">' + c.stat + '</p>' +
        '</div>' +
      '</div>';
    modal.classList.add('open');
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', escClose);
  }
  function closeModal() { const m = document.getElementById('caseModal'); if (m) m.classList.remove('open'); document.removeEventListener('keydown', escClose); }
  function escClose(e) { if (e.key === 'Escape') closeModal(); }

  /* ============================================================
   * 计数器动画（数字从 0 滚到目标）
   * ============================================================ */
  function animateCounters(box) {
    box.querySelectorAll('.stat-num').forEach(function (n) {
      const text = n.textContent;
      const m = text.match(/^(\d+)(\+?)$/);
      if (!m) return;
      const target = parseInt(m[1], 10), suffix = m[2] || '';
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1200, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ============================================================
   * 语言切换
   * ============================================================ */
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      const k = n.getAttribute('data-i18n');
      if (I18N[lang][k]) n.textContent = I18N[lang][k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (n) {
      const k = n.getAttribute('data-i18n-placeholder');
      if (I18N[lang][k]) n.placeholder = I18N[lang][k];
    });
    document.querySelector('.lang-zh').classList.toggle('active', lang === 'zh');
    document.querySelector('.lang-en').classList.toggle('active', lang === 'en');
  }
  document.getElementById('langToggle').addEventListener('click', function () {
    lang = lang === 'zh' ? 'en' : 'zh';
    applyLang();
  });

  /* ============================================================
   * 简报表单提交（写回 Airtable 或本地确认）
   * ============================================================ */
  const briefForm = document.getElementById('briefForm');
  briefForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const picked = {};
    document.querySelectorAll('[data-chips]').forEach(function (g) {
      const sel = g.querySelector('.chip.selected');
      picked[g.getAttribute('data-chips')] = sel ? sel.textContent : null;
    });
    const note = document.getElementById('formNote');
    note.hidden = false;
    note.textContent = lang === 'zh' ? '已收到，我们会尽快跟进。' : "You're on the list — we'll follow up shortly.";
    if (AIRTABLE.PAT) {
      // TODO: 写入 Airtable「Action Queue」表（需 PAT + 表已建）
      console.log('brief picked:', picked);
    }
    briefForm.querySelector('.btn').textContent = lang === 'zh' ? '已提交' : 'Submitted';
  });

  document.getElementById('chatSend').addEventListener('click', function () {
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    const chat = document.querySelector('.chat');
    const m = el('div', 'msg user', '<p>' + input.value.replace(/</g, '&lt;') + '</p>');
    chat.appendChild(m);
    input.value = '';
  });

  /* ============================================================
   * 自定义光标（点 + 环 + 彗星尾）
   * ============================================================ */
  function initCursor() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return; // 触屏不启用
    document.body.classList.add('custom-cursor');

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const canvas = document.getElementById('cursorTrail');
    const ctx = canvas.getContext('2d');

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my; // ring 位置（带缓动）
    const trail = []; // 彗星尾粒子

    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize(); addEventListener('resize', resize);

    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      // 生成彗星尾粒子
      trail.push({ x: mx, y: my, life: 1, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2 - 0.4 });
      if (trail.length > 60) trail.shift();
    });

    // hover 放大环
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .chip, .filter-chip, .case-card, .cap-card, .member-card')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, .chip, .filter-chip, .case-card, .cap-card, .member-card')) ring.classList.remove('is-hover');
    });

    function loop() {
      // 环缓动
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';

      // 彗星尾
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.035;
        p.x += p.vx; p.y += p.vy;
        if (p.life <= 0) { trail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(231,255,46,' + (0.5 * p.life).toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============================================================
   * 滚动动画 + 头部状态
   * ============================================================ */
  function initScroll() {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.querySelector('.stat-num')) animateCounters(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (n) { io.observe(n); });

    const header = document.getElementById('header');
    addEventListener('scroll', function () {
      header.classList.toggle('scrolled', scrollY > 10);
    }, { passive: true });
  }

  /* ============================================================
   * Airtable 拉取（PAT 配置后生效）
   * ============================================================ */
  async function loadFromAirtable() {
    if (!AIRTABLE.PAT) return;
    const headers = { Authorization: 'Bearer ' + AIRTABLE.PAT };
    try {
      const [cases, team] = await Promise.all([
        fetch('https://api.airtable.com/v0/' + AIRTABLE.BASE_ID + '/' + encodeURIComponent(AIRTABLE.TABLES.cases) + '?maxRecords=100', { headers }),
        fetch('https://api.airtable.com/v0/' + AIRTABLE.BASE_ID + '/' + encodeURIComponent(AIRTABLE.TABLES.team) + '?maxRecords=100', { headers })
      ]);
      const cj = await cases.json(); const tj = await team.json();
      if (cj.records && cj.records.length) {
        DATA.cases = cj.records.map(function (r) {
          const f = r.fields;
          return { name: f.Name || '', nameCn: f.NameCN || '', tag: f.Industry || '', title: f.Title || '', stat: f.Stat || '', gradient: 'linear-gradient(180deg,#141410,#2a2a22)' };
        });
      }
      if (tj.records && tj.records.length) {
        DATA.team = tj.records.map(function (r) {
          const f = r.fields;
          return { name: f.Name || '', role: f.Role || '', desc: f.Bio || '', photo: (f.Photo && f.Photo[0] && f.Photo[0].url) || '' };
        });
      }
      renderAll();
    } catch (err) {
      console.warn('Airtable 拉取失败，使用内置内容：', err);
    }
  }

  /* ---------- 启动 ---------- */
  renderAll();
  applyLang();
  initCursor();
  initScroll();
  loadFromAirtable();
})();
