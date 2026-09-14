(function(){
  'use strict';

  var items = [
    {
      slug:'speech-analytics', path:'/speech-analytics/', icon:'🎙️', status:'live',
      categories:['sales','team'], tags:['Sales','Team'],
      title:'Sales Conversation Intelligence',
      summary:'Reviews customer emails, notes, and available call recordings to show where reps lose deals — and gives each rep a focused coaching plan.'
    },
    {
      slug:'cash-flow-statement', icon:'🏦', status:'soon',
      categories:['finance','operations'], tags:['Finance','Operations'],
      title:'Cash Flow Statement from Bank Transactions',
      summary:'Categorizes transactions and builds a clear cash flow statement without a hand-maintained spreadsheet.'
    },
    {
      slug:'competitor-monitoring', icon:'🕵️', status:'soon',
      categories:['marketing'], tags:['Marketing'],
      title:'Competitor Change Monitor',
      summary:'Tracks competitors’ pricing, products, and promotions so your team does not have to check every site by hand.'
    },
    {
      slug:'sales-funnel-analysis', path:'/skills/sales-funnel-analysis/', icon:'📊', status:'live',
      categories:['sales'], tags:['Sales'],
      title:'Sales Pipeline Analysis',
      summary:'Finds the stages where deals stall or die and estimates the revenue impact of those leaks.'
    },
    {
      slug:'daily-pulse', icon:'🌅', status:'soon',
      categories:['operations','team'], tags:['Operations','Team'],
      title:'Daily Business Pulse',
      summary:'Delivers one morning brief with new leads, stalled deals, yesterday’s wins, and the issues that need attention.'
    },
    {
      slug:'abcd-customer-analysis', icon:'🧮', status:'soon',
      categories:['sales','marketing'], tags:['Sales','Marketing'],
      title:'Customer Portfolio Analysis',
      summary:'Shows which customers drive revenue, which are growing, which have gone quiet, and which are at risk.'
    },
    {
      slug:'sales-manager-activity', icon:'🏃', status:'live',
      categories:['team','sales'], tags:['Team','Sales'],
      title:'Sales Rep Activity Analytics',
      summary:'Uses HubSpot activity data to show which reps actually moved deals forward this week — and where follow-up stopped.'
    },
    {
      slug:'manager-coaching', icon:'🧑‍💼', status:'soon',
      categories:['team','sales'], tags:['Team','Sales'],
      title:'Personalized Rep Coaching',
      summary:'Gives each rep a private review of their conversations, strengths, recurring mistakes, and next skill to practice.'
    },
    {
      slug:'personalized-proposals', icon:'📄', status:'soon',
      categories:['sales','marketing'], tags:['Sales','Marketing'],
      title:'Personalized Sales Proposals',
      summary:'Builds customer-specific proposals from your offer, business data, and brand — without starting from a blank page.'
    },
    {
      slug:'expense-optimization', icon:'✂️', status:'soon',
      categories:['finance'], tags:['Finance'],
      title:'Expense Optimization',
      summary:'Finds avoidable spend and shows what you can save each month without cutting the capabilities that drive growth.'
    },
    {
      slug:'profit-and-loss', icon:'📈', status:'soon',
      categories:['finance'], tags:['Finance'],
      title:'Profit & Loss Statement',
      summary:'Turns your source files into an owner-ready P&L that makes revenue, gross margin, operating expenses, and net income easy to read.'
    },
    {
      slug:'cash-flow-xray', icon:'💸', status:'soon',
      categories:['finance','operations'], tags:['Finance','Operations'],
      title:'Cash Flow X-Ray',
      summary:'Shows where cash is actually going and highlights savings opportunities directly from bank transactions.'
    },
    {
      slug:'debtor-radar', icon:'⏳', status:'soon',
      categories:['finance','sales'], tags:['Finance','Sales'],
      title:'Accounts Receivable Radar',
      summary:'Shows who owes you, how much is outstanding, and how long it has been open — before an invoice turns into a write-off.'
    },
    {
      slug:'rfm-customer-analysis', icon:'🎯', status:'soon',
      categories:['marketing','sales'], tags:['Marketing','Sales'],
      title:'RFM Customer Segmentation',
      summary:'Shows who is ready to buy again, who needs a win-back campaign, and which segments should not absorb more budget.'
    }
  ];

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(character){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character];
    });
  }

  function statusLabel(item){ return item.status === 'live' ? 'LIVE' : 'COMING SOON'; }

  function interestUrl(item){
    var message = 'Hi! I\'m writing from uniqore.ai. I need the "' + item.title + '" skill.';
    return window.UniqoreContact ? window.UniqoreContact.whatsappUrl(message) : 'https://wa.me/';
  }

  function renderCatalog(container){
    if (!container) return;
    container.innerHTML = items.map(function(item){
      var cta = item.status === 'live'
        ? (item.path
          ? '<a class="btn btn-primary btn-sm auto-card-cta" href="' + item.path + '">View automation →</a>'
          : '<a class="btn btn-primary btn-sm auto-card-cta" href="/download/">In the app →</a>')
        : '<a class="btn btn-sm auto-card-cta auto-card-interest" href="' + interestUrl(item) + '" target="_blank" rel="noopener" aria-label="I need the ' + escapeHtml(item.title) + ' automation">I need this</a>';
      return '<article class="auto-card" data-categories="' + item.categories.join(' ') + '">' +
        '<div class="auto-card-top"><div class="auto-card-icon" aria-hidden="true">' + item.icon + '</div>' +
        '<span class="auto-status ' + item.status + '">' + statusLabel(item) + '</span></div>' +
        '<h4>' + escapeHtml(item.title) + '</h4>' +
        '<p>' + escapeHtml(item.summary) + '</p>' +
        '<div class="auto-card-footer"><div class="auto-card-tags">' + item.tags.map(function(tag){ return '<span class="auto-card-tag">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' + cta + '</div>' +
      '</article>';
    }).join('');
  }

  function currentSlug(){
    var parts = location.pathname.split('/').filter(Boolean);
    return parts.length > 1 && parts[0] === 'skills' ? parts[1] : '';
  }

  function renderDetail(container){
    if (!container) return;
    var slug = container.dataset.automationSlug || currentSlug();
    var item = items.find(function(candidate){ return candidate.slug === slug; });
    if (!item || item.status !== 'live') {
      container.innerHTML = '<div class="automation-detail-card card"><h1>Skill not found</h1><p>Return to the catalog and choose a ready-made skill.</p><a class="btn btn-primary" href="/skills/">All skills →</a></div>';
      return;
    }
    var primary = '<a class="btn btn-primary" href="/download/">Download and launch</a>';
    container.innerHTML = '<div class="automation-detail-card card">' +
      '<div class="automation-detail-top"><div class="automation-detail-icon" aria-hidden="true">' + item.icon + '</div><span class="auto-status ' + item.status + '">' + statusLabel(item) + '</span></div>' +
      '<h1>' + escapeHtml(item.title) + '</h1>' +
      '<p class="automation-detail-summary">' + escapeHtml(item.summary) + '</p>' +
      '<div class="auto-card-tags">' + item.tags.map(function(tag){ return '<span class="auto-card-tag">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' +
      '<div class="automation-detail-actions">' + primary + '<a class="btn btn-ghost" href="/skills/">All skills →</a></div>' +
    '</div>';
  }

  window.UniqoreAutomations = {items:items,renderCatalog:renderCatalog,renderDetail:renderDetail};
})();
