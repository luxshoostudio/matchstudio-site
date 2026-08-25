/* Match Studio founder profile pages. Airtable attribution is a public snapshot; media stays local. */
(function () {
  'use strict';

  var lang = localStorage.getItem('ms-lang') === 'en' ? 'en' : 'zh';
  var slug = document.body.getAttribute('data-founder') || 'lux';
  var data = { cases: [] };
  var links = [];
  var localCases = [];

  var I18N = {
    zh: {
      'nav.services': '服务', 'nav.cases': '案例', 'nav.team': '团队', 'nav.capabilities': '能力', 'nav.cta': '预约咨询', 'footer.tagline': '中国企业出海的全球内容制作伙伴',
      'founder.eyebrow': '创始人履历', 'founder.source': 'Participants / Ability Source', 'founder.caseEyebrow': '关联内容案例', 'founder.caseTitle': '履历下的内容案例',
      'founder.caseSub': '按 Airtable 的 Participants / Ability Source 关系整理。公开口径保持为 Match Studio 核心团队服务经验，不扩写为未核实的直签项目。',
      'founder.sourceLabel': '能力来源', 'founder.mediaReady': '本地媒体已同步', 'founder.mediaPending': '媒体快照待同步', 'founder.viewLibrary': '查看全部案例',
      'founder.back': '返回团队', 'founder.attribution': '公开归因', 'founder.attributionText': 'Match Studio 核心团队服务经验', 'founder.empty': '当前没有已关联的公开案例快照。',
      'founder.count': '条关联记录', 'founder.ready': '条已同步媒体', 'founder.roleLabel': '职责', 'founder.focusLabel': '工作范围'
    },
    en: {
      'nav.services': 'Services', 'nav.cases': 'Cases', 'nav.team': 'Team', 'nav.capabilities': 'Capabilities', 'nav.cta': 'Book a consult', 'footer.tagline': 'The global content partner for outbound Chinese brands',
      'founder.eyebrow': 'Founder profile', 'founder.source': 'Participants / Ability Source', 'founder.caseEyebrow': 'Linked case library', 'founder.caseTitle': 'Cases from this profile',
      'founder.caseSub': 'Linked from Airtable Participants / Ability Source records. Public attribution stays with Match Studio core-team experience and does not overstate unverified direct commissions.',
      'founder.sourceLabel': 'Ability source', 'founder.mediaReady': 'Local media synced', 'founder.mediaPending': 'Media snapshot pending', 'founder.viewLibrary': 'View all cases',
      'founder.back': 'Back to team', 'founder.attribution': 'Public attribution', 'founder.attributionText': 'Match Studio core-team experience', 'founder.empty': 'No linked public case snapshot is available yet.',
      'founder.count': 'linked records', 'founder.ready': 'with synced media', 'founder.roleLabel': 'Role', 'founder.focusLabel': 'Focus'
    }
  };

  var PROFILES = {
    lux: {
      name: { zh: 'Lux', en: 'Lux' },
      role: { zh: '创始人 · 项目负责人', en: 'Founder · Executive producer' },
      bio: { zh: '品牌营销、整合 Campaign 与跨市场项目统筹。', en: 'Brand marketing, integrated campaigns and cross-market production.' },
      background: { zh: '10+ 年品牌营销与整合 Campaign 经验，100+ 项目经验；负责中美团队沟通、内容创作与跨市场项目统筹，常驻美国。', en: '10+ years in brand marketing and integrated campaigns, with 100+ projects across US–China teams, content and cross-market production.' },
      focus: { zh: ['品牌营销', '跨市场统筹', '全球内容制作', '10X10 团队资料'], en: ['Brand marketing', 'Cross-market production', 'Global content', '10X10 team records'] },
      photo: '../assets/team/lux.jpg'
    },
    'liao-kuo': {
      name: { zh: '廖阔', en: 'Liao Kuo' },
      role: { zh: '全球拍摄与直播', en: 'Global field production and live' },
      bio: { zh: '纪录片、宣传片、无人机与海外现场制作。', en: 'Documentary, branded film, aerial and overseas field production.' },
      background: { zh: '十多年纪录片、宣传片、无人机和海外拍摄经验，覆盖摄影指导、导播直播、航拍与全球现场执行。', en: 'More than a decade in documentary, branded film, aerial and overseas production, spanning cinematography, live direction and field execution.' },
      focus: { zh: ['纪录片', '品牌影像', '无人机与航拍', '跨洲直播'], en: ['Documentary', 'Branded film', 'Aerial production', 'Cross-continental live'] },
      photo: '../assets/team/liaokuo.jpg', safeHeadroom: true
    },
    'bang-wei': {
      name: { zh: '邦威', en: 'Bang Wei' },
      role: { zh: 'AI 导演 · 后期监制', en: 'AI director · Post-production supervisor' },
      bio: { zh: 'TVC、CG、特效、AI 视频导演与整体制作统筹。', en: 'TVC, CG, VFX and AI video direction across the full production.' },
      background: { zh: 'AI 导演、后期导演与后期监制，覆盖 TVC、CG、特效、AI 视频和整体制作统筹。', en: 'AI director, post-production director and supervisor across TVC, CG, VFX, AI video and full production coordination.' },
      focus: { zh: ['AI 导演', 'TVC 与 CG', '特效制作', '后期监制'], en: ['AI direction', 'TVC and CG', 'VFX', 'Post supervision'] },
      photo: '../assets/team/bangwei.jpg'
    },
    'liu-chen': {
      name: { zh: '刘宸', en: 'Liu Chen' },
      role: { zh: '企业 AI 落地', en: 'AI in Business' },
      bio: { zh: '工学博士、大数据科学家，企业 AI 培训与工作流共创。', en: 'Engineer, data scientist and partner for AI training and workflow design.' },
      background: { zh: '工学博士、大数据科学家与 AI 部署实践者，参与银行和企业 AI 培训、Agent、数字员工与工作流共创。', en: 'Engineer, data scientist and AI deployment practitioner working across enterprise training, agents, digital workers and workflow design.' },
      focus: { zh: ['AI 认知', 'Agent', '数字员工', '工作流共创'], en: ['AI literacy', 'Agents', 'Digital workers', 'Workflow co-design'] },
      photo: '../assets/team/liuchen.jpg'
    }
  };

  function t(key) { return I18N[lang][key] || key; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function normalizeId(value) { var match = String(value || '').match(/MS-?0*(\d+)/i); return match ? 'MS-CA-' + String(Number(match[1])).padStart(3, '0') : String(value || ''); }
  function localAsset(url) { return url && url.indexOf('assets/') === 0 ? '../' + url : url; }
  function mediaUrl(item) { return item && (item.url || (item.thumbnails && item.thumbnails.large && item.thumbnails.large.url)); }
  function mediaOf(item) { return (item.hero || [])[0] || (item.gallery || [])[0] || null; }
  function sourceText(value) {
    if (lang === 'zh') return value;
    return String(value || '').replace(/邦威/g, 'Bang Wei').replace(/廖阔/g, 'Liao Kuo').replace(/刘宸/g, 'Liu Chen').replace(/能力资料/g, 'capability records').replace(/近期作品资料/g, 'recent portfolio records').replace(/作品资料/g, 'portfolio records').replace(/业务资料/g, 'business records').replace(/团队资料/g, 'team records').replace(/导演颜子欣（新加坡）/g, 'Director Yan Zixin (Singapore)').replace(/摄影师徐万利、李勤；导演戴晓莲/g, 'Cinematographers Xu Wanli and Li Qin; director Dai Xiaolian').replace(/Tony（美国）/g, 'Tony (United States)').replace(/齐活文化/g, 'Qihuo Culture').replace(/廖阔/g, 'Liao Kuo');
  }
  function clientText(value) {
    if (lang === 'zh') return value;
    var map = { '腾讯视频': 'Tencent Video', '腾讯': 'Tencent', '京东': 'JD.com', '华为': 'Huawei', '网易': 'NetEase', '番茄小说': 'Tomato Novel', '长安汽车': 'Changan Automobile', '小鸟转': 'Xiaoniaozhuan', '海信': 'Hisense', '德芙': 'Dove', '蒙牛': 'Mengniu', '战马': 'War Horse', '抖音': 'Douyin', '淘宝': 'Taobao', '天猫': 'Tmall', '优酷': 'Youku', '四川电视台': 'Sichuan TV', '阿里云': 'Alibaba Cloud', '得到': 'Dedao', '蚂蚁集团': 'Ant Group', '多客户／未逐案归档': 'Multiple clients / not individually archived', '多家金融机构／企业团队': 'Financial institutions / enterprise teams', '自有／电影节项目': 'Self-held / festival project', '客户待核／中新联合制作': 'Client pending / China-Singapore co-production', 'CNC／新华社': 'CNC / Xinhua', 'CCTV 法语／CCTV 纪录／France 5': 'CCTV French / CCTV Documentary / France 5', '瑞幸咖啡': 'Luckin Coffee' };
    return map[value] || value;
  }
  function displayCase(item, link) {
    var local = !!item;
    var title = local ? (lang === 'zh' ? item.title : (item.titleEn || item.title)) : (lang === 'zh' ? (link.title || link.caseId) : (link.titleEn || link.title || link.caseId));
    var client = local && item.client && !/^Open\s+—/i.test(item.client) ? item.client : (link.client || '');
    client = clientText(client);
    var intro = local ? (lang === 'zh' ? item.intro.zh : (item.intro.en || item.intro.zh)) : (lang === 'zh' ? 'Airtable 已关联该案例，公开站点媒体快照待同步。' : 'This Airtable-linked case is awaiting a local public media snapshot.');
    var approach = local ? (lang === 'zh' ? item.approach.zh : (item.approach.en || item.approach.zh)) : (lang === 'zh' ? '具体制作方式以已核实资料为准。' : 'Production details remain subject to verified project records.');
    var media = local ? mediaUrl(mediaOf(item)) : '';
    var id = local ? item.caseId : normalizeId(link.caseId);
    var source = sourceText(link.source || '');
    return { local: local, title: title, client: client, intro: intro, approach: approach, media: media, id: id, source: source };
  }
  function renderProfile() {
    var profile = PROFILES[slug] || PROFILES.lux;
    document.title = (profile.name[lang] || profile.name.zh) + ' · Match Studio';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (node) { var key = node.getAttribute('data-i18n'); node.textContent = I18N[lang][key] || key; });
    document.querySelector('.lang-zh').classList.toggle('active', lang === 'zh');
    document.querySelector('.lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('founderName').textContent = profile.name[lang];
    document.getElementById('founderRole').textContent = profile.role[lang];
    document.getElementById('founderBio').textContent = profile.bio[lang];
    document.getElementById('founderBackground').textContent = profile.background[lang];
    document.getElementById('founderPhoto').src = profile.photo;
    document.getElementById('founderPhoto').alt = profile.name[lang];
    document.getElementById('founderFocus').innerHTML = profile.focus[lang].map(function (item) { return '<span>' + esc(item) + '</span>'; }).join('');
    var byId = {}; localCases.forEach(function (item) { byId[item.caseId] = item; });
    var cards = links.map(function (link) { return displayCase(byId[normalizeId(link.caseId)], link); });
    var readyCount = cards.filter(function (item) { return item.local; }).length;
    document.getElementById('founderCount').textContent = cards.length + ' ' + t('founder.count');
    document.getElementById('founderReady').textContent = readyCount + ' ' + t('founder.ready');
    var grid = document.getElementById('founderCases');
    grid.innerHTML = cards.length ? cards.map(function (item) {
      var media = item.media ? '<div class="founder-case-media"><img src="' + esc(localAsset(item.media)) + '" alt="' + esc(item.title) + '" loading="lazy"><span class="founder-case-status">' + esc(t('founder.mediaReady')) + '</span></div>' : '<div class="founder-case-media is-pending"><span class="founder-pending-mark">' + esc(t('founder.mediaPending')) + '</span><b>' + esc(item.id) + '</b></div>';
      return '<article class="founder-case-card' + (item.local ? '' : ' is-pending') + '">' + media + '<div class="founder-case-body"><div class="founder-case-meta"><span>' + esc(item.client || item.id) + '</span><span>' + esc(item.id) + '</span></div><h3>' + esc(item.title) + '</h3><span class="founder-case-label">' + esc(t('founder.sourceLabel')) + '</span><p class="founder-case-source">' + esc(item.source) + '</p><p class="founder-case-intro">' + esc(item.intro) + '</p><span class="founder-case-label">' + esc(lang === 'zh' ? '制作方式' : 'Approach') + '</span><p class="founder-case-approach">' + esc(item.approach) + '</p></div></article>';
    }).join('') : '<div class="founder-empty">' + esc(t('founder.empty')) + '</div>';
  }
  function applyPageData() {
    var profile = PROFILES[slug] || PROFILES.lux;
    document.getElementById('founderPhoto').classList.toggle('safe-headroom', !!profile.safeHeadroom);
    renderProfile();
  }
  function bind() {
    document.getElementById('langToggle').addEventListener('click', function () { lang = lang === 'zh' ? 'en' : 'zh'; localStorage.setItem('ms-lang', lang); renderProfile(); });
  }
  function load() {
    Promise.all([fetch('../data/cases.json?v=20260825-founders', { cache: 'no-store' }).then(function (r) { return r.json(); }), fetch('../data/founder-cases.json?v=20260825-founders', { cache: 'no-store' }).then(function (r) { return r.json(); })]).then(function (result) {
      data = result[0] || data; links = (result[1] && result[1][slug]) || []; localCases = data.cases || []; applyPageData();
    }).catch(function (error) { console.warn('Founder data unavailable:', error.message); applyPageData(); });
  }
  bind(); applyPageData(); load();
})();
