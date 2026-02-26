// ─── DATA ───
let transactions = JSON.parse(localStorage.getItem('dku_tx') || '[]');
let accounts = JSON.parse(localStorage.getItem('dku_acc') || '[]');
let budgets = JSON.parse(localStorage.getItem('dku_budgets') || '{}');
let currentPeriod = 'hari';
let currentType = 'masuk';

if (!accounts.length) {
  accounts = [
    { id: 1, name: 'Cash', icon: '💵', color: '#0ab68b', init: 0 },
    { id: 2, name: 'BCA', icon: '🏦', color: '#2196f3', init: 0 },
    { id: 3, name: 'DANA', icon: '📱', color: '#e91e8c', init: 0 }
  ];
  saveAccounts();
}

function saveTx() { localStorage.setItem('dku_tx', JSON.stringify(transactions)); }
function saveAccounts() { localStorage.setItem('dku_acc', JSON.stringify(accounts)); }
function saveBudgetStore() { localStorage.setItem('dku_budgets', JSON.stringify(budgets)); }

const catCfg = {
  saving: { label: 'Tabungan', icon: '💜', color: 'var(--saving)' },
  daily: { label: 'Keseharian', icon: '🌤', color: 'var(--daily)' },
  lifestyle: { label: 'Lifestyle', icon: '🌿', color: 'var(--lifestyle)' },
  play: { label: 'Hiburan', icon: '🎮', color: 'var(--play)' },
  lainnya: { label: 'Lainnya', icon: '📦', color: 'var(--muted)' },
};
const catColors = {
  saving: '#7c5cfc',
  daily: '#2196f3',
  lifestyle: '#ff7d45',
  play: '#e91e8c',
  lainnya: '#7eaaa0'
};

// ─── HELPERS ───
function fmt(n) {
  if (isNaN(n) || n === null || n === undefined) return 'Rp 0';
  return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
}
function fmtRaw(s) { return parseInt(s.replace(/\D/g, '')) || 0; }
function formatAmountInput(el) {
  let v = el.value.replace(/\D/g, '');
  el.value = v ? 'Rp ' + parseInt(v).toLocaleString('id-ID') : '';
}
function formatBudgetInput(el) {
  let v = el.value.replace(/\D/g, '');
  el.value = v ? 'Rp ' + parseInt(v).toLocaleString('id-ID') : '';
}
function getInputVal(el) { return fmtRaw(el.value); }
function nowStr() { return new Date().toISOString(); }
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.toDateString() === n.toDateString();
}
function isThisWeek(iso) {
  const d = new Date(iso), n = new Date();
  const s = new Date(n);
  s.setDate(n.getDate() - n.getDay());
  s.setHours(0, 0, 0, 0);
  return d >= s;
}
function isThisMonth(iso) {
  const d = new Date(iso), n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

// ─── NAV ───
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'transaksi') renderHistory();
  if (id === 'akun') renderAccounts();
  if (id === 'budget') renderBudgetPage();
  if (id === 'saving') renderSavingPage();
  closeSidebarMobile();
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlayBg').classList.toggle('show');
}
function closeSidebarMobile() {
  if (window.innerWidth <= 820) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlayBg').classList.remove('show');
  }
}
function setPeriod(p, el) {
  currentPeriod = p;
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDashboard();
}
function filterByPeriod(list) {
  if (currentPeriod === 'hari') return list.filter(t => isToday(t.date));
  if (currentPeriod === 'minggu') return list.filter(t => isThisWeek(t.date));
  return list.filter(t => isThisMonth(t.date));
}

// ─── MODAL TRANSAKSI ───
let dtInterval;
function openModal() {
  clearInterval(dtInterval);
  updateDatetime();
  dtInterval = setInterval(updateDatetime, 1000);
  const sel = document.getElementById('tx-akun');
  sel.innerHTML = accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('');
  document.getElementById('modal').classList.add('show');
}
function closeModal() {
  clearInterval(dtInterval);
  document.getElementById('modal').classList.remove('show');
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}
function updateDatetime() {
  const el = document.getElementById('tx-datetime');
  if (el) el.textContent = fmtDate(new Date().toISOString());
}
function setType(type, el) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('keterangan-label').textContent = type === 'masuk' ? 'Dari Siapa' : 'Keperluan';
}

// ─── MODAL AKUN ───
function openAccModal() { document.getElementById('acc-modal').classList.add('show'); }
function closeAccModal() { document.getElementById('acc-modal').classList.remove('show'); }
function closeAccModalOutside(e) {
  if (e.target === document.getElementById('acc-modal')) closeAccModal();
}

// ─── ADD TRANSACTION ───
function addTransaction() {
  const amt = getInputVal(document.getElementById('tx-amount'));
  const ket = document.getElementById('tx-keterangan').value.trim();
  const cat = document.getElementById('tx-kategori').value;
  const accId = parseInt(document.getElementById('tx-akun').value);
  if (!amt) { showToast('❌ Masukkan nominal!'); return; }
  if (!ket) { showToast('❌ Isi keterangan!'); return; }
  const tx = { id: Date.now(), type: currentType, amount: amt, keterangan: ket, kategori: cat, accId, date: nowStr() };
  transactions.unshift(tx);
  saveTx();
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-keterangan').value = '';
  closeModal();
  checkBudgetNotif(cat, tx);
  renderDashboard();
  showToast('✅ Transaksi disimpan!');
}

// ─── ADD ACCOUNT ───
function addAccount() {
  const name = document.getElementById('acc-name').value.trim();
  const icon = document.getElementById('acc-icon').value;
  const init = getInputVal(document.getElementById('acc-init'));
  const color = document.getElementById('acc-color').value;
  if (!name) { showToast('❌ Isi nama akun!'); return; }
  accounts.push({ id: Date.now(), name, icon, color, init });
  saveAccounts();
  document.getElementById('acc-name').value = '';
  document.getElementById('acc-init').value = '';
  closeAccModal();
  renderAccounts();
  renderDashboard();
  showToast('✅ Akun ditambahkan!');
}

// ─── BALANCE CALCULATIONS ───
function getAccBalance(accId) {
  const acc = accounts.find(a => a.id === accId);
  const init = acc ? acc.init : 0;
  const txs = transactions.filter(t => t.accId === accId);
  return init
    + txs.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
    - txs.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0);
}
function getTotalBalance() { return accounts.reduce((s, a) => s + getAccBalance(a.id), 0); }
function getPeriodTotals() {
  const list = filterByPeriod(transactions);
  return {
    income: list.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0),
    expense: list.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  };
}
function getBudgetSpent(cat) {
  return transactions
    .filter(t => t.type === 'keluar' && t.kategori === cat && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0);
}

// ─── RENDER DASHBOARD ───
function renderDashboard() {
  const p = getPeriodTotals();
  const totalBal = getTotalBalance();
  const savTx = transactions.filter(t => t.kategori === 'saving' && t.type === 'masuk');
  const totalSaving = savTx.reduce((s, t) => s + t.amount, 0);

  document.getElementById('total-balance').textContent = fmt(totalBal);
  document.getElementById('total-income').textContent = fmt(p.income);
  document.getElementById('total-expense').textContent = fmt(p.expense);
  document.getElementById('total-saving').textContent = fmt(totalSaving);
  document.getElementById('net-worth').textContent = fmt(totalBal);
  document.getElementById('bal-income').textContent = fmt(p.income);
  document.getElementById('bal-expense').textContent = fmt(p.expense);
  document.getElementById('bal-diff').textContent = fmt(p.income - p.expense);

  const pl = { 'hari': 'Hari Ini', 'minggu': 'Minggu Ini', 'bulan': 'Bulan Ini' }[currentPeriod];
  document.getElementById('income-period').textContent = pl;
  document.getElementById('expense-period').textContent = pl;
  document.getElementById('bal-date').textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('acc-tags').innerHTML = accounts.map(a =>
    `<div class="acc-pill">${a.icon} ${a.name}: ${fmt(getAccBalance(a.id))}</div>`
  ).join('');

  renderRecentTx();
  renderMiniChart();
  renderBudgetOverview();
  renderNotifications();
}

// ─── TX ITEM HTML ───
function txItemHTML(t) {
  const acc = accounts.find(a => a.id === t.accId);
  const cat = catCfg[t.kategori] || catCfg.lainnya;
  const isIn = t.type === 'masuk';
  return `<div class="tx-item">
    <div class="tx-icon-wrap" style="background:${isIn ? 'rgba(10,182,139,.1)' : 'rgba(240,78,110,.08)'}">${cat.icon}</div>
    <div class="tx-body">
      <div class="tx-name">${t.keterangan}</div>
      <div class="tx-meta"><span class="tx-cat-tag">${cat.label}</span><span>${acc ? acc.icon + ' ' + acc.name : '—'}</span></div>
    </div>
    <div class="tx-right">
      <div class="tx-amount" style="color:${isIn ? 'var(--income)' : 'var(--expense)'}">${isIn ? '+' : '-'}${fmt(t.amount)}</div>
      <div class="tx-time">${fmtDate(t.date)}</div>
    </div>
  </div>`;
}

function renderRecentTx() {
  const el = document.getElementById('recent-tx');
  const recent = transactions.slice(0, 5);
  el.innerHTML = recent.length
    ? recent.map(t => txItemHTML(t)).join('')
    : '<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Belum ada transaksi</div></div>';
}

// ─── MINI CHART ───
function renderMiniChart() {
  const el = document.getElementById('mini-chart');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    const total = transactions
      .filter(t => t.type === 'keluar' && new Date(t.date).toDateString() === ds)
      .reduce((s, t) => s + t.amount, 0);
    days.push({ label: d.toLocaleDateString('id-ID', { weekday: 'short' }), val: total });
  }
  const max = Math.max(...days.map(d => d.val), 1);
  if (days.every(d => d.val === 0)) {
    el.innerHTML = '<div style="color:var(--muted);font-size:.75rem;align-self:center;width:100%;text-align:center">Belum ada data pengeluaran</div>';
    return;
  }
  el.innerHTML = days.map((d, i) => {
    const h = Math.max((d.val / max) * 58, 3);
    const isToday2 = i === 6;
    return `<div class="chart-bar-col">
      <div class="chart-bar" style="height:${h}px;background:${isToday2 ? 'linear-gradient(to top,var(--teal-dark),var(--teal2))' : 'linear-gradient(to top,rgba(10,182,139,.35),rgba(10,182,139,.55))'}"></div>
      <div class="chart-bar-label">${d.label}</div>
    </div>`;
  }).join('');
}

// ─── BUDGET OVERVIEW ───
function renderBudgetOverview() {
  const el = document.getElementById('budget-overview');
  const cats = ['saving', 'daily', 'lifestyle', 'play', 'lainnya'];
  const items = cats.map(c => {
    const limit = budgets[c] || 0;
    const spent = getBudgetSpent(c);
    const cfg = catCfg[c];
    if (!limit && !spent) return null;
    const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
    return { c, limit, spent, cfg, pct };
  }).filter(Boolean);

  if (!items.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Atur budget dulu di menu Budget</div></div>';
    return;
  }
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px">
    ${items.map(({ c, limit, spent, cfg, pct }) => `
    <div class="budget-row">
      <div class="budget-head">
        <div class="budget-cat"><div class="budget-dot" style="background:${catColors[c]}"></div>${cfg.icon} ${cfg.label}</div>
        <div class="budget-pct" style="color:${pct >= 80 ? 'var(--expense)' : pct >= 50 ? 'var(--lifestyle)' : 'var(--income)'}">${Math.round(pct)}%</div>
      </div>
      <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${pct >= 80 ? 'var(--expense)' : pct >= 50 ? 'var(--lifestyle)' : catColors[c]}"></div></div>
      <div class="budget-foot"><span>${fmt(spent)}</span><span>${limit ? fmt(limit) : 'Belum diset'}</span></div>
    </div>`).join('')}
  </div>`;
}

// ─── NOTIFICATIONS ───
function renderNotifications() {
  const el = document.getElementById('notif-list');
  const cats = ['saving', 'daily', 'lifestyle', 'play', 'lainnya'];
  const notifs = [];
  cats.forEach(c => {
    const limit = budgets[c];
    if (!limit) return;
    const spent = getBudgetSpent(c);
    const pct = (spent / limit) * 100;
    const cfg = catCfg[c];
    if (pct >= 80) notifs.push({ icon: '🔴', cat: cfg.label, pct, msg: 'Hampir habis!', color: 'var(--expense)' });
    else if (pct >= 50) notifs.push({ icon: '🟡', cat: cfg.label, pct, msg: 'Sudah setengah', color: 'var(--lifestyle)' });
    else if (pct >= 30) notifs.push({ icon: '🟢', cat: cfg.label, pct, msg: 'Masih aman', color: 'var(--income)' });
  });
  el.innerHTML = notifs.length
    ? notifs.map(n => `<div class="notif-item">
        <div class="notif-dot" style="background:${n.color}"></div>
        <div><div class="notif-text">${n.icon} ${n.cat} — ${Math.round(n.pct)}%</div><div class="notif-sub">${n.msg}</div></div>
      </div>`).join('')
    : '<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">Semua budget aman</div></div>';
}

function checkBudgetNotif(cat, tx) {
  if (tx.type !== 'keluar') return;
  const limit = budgets[cat];
  if (!limit) return;
  const spent = getBudgetSpent(cat);
  const pct = (spent / limit) * 100;
  const cfg = catCfg[cat] || catCfg.lainnya;
  if (pct >= 80) showToast(`🔴 ${cfg.label}: ${Math.round(pct)}% terpakai!`);
  else if (pct >= 50) showToast(`🟡 ${cfg.label}: 50% terpakai`);
}

// ─── RENDER HISTORY ───
function renderHistory() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const typeF = document.getElementById('filter-type').value;
  const catF = document.getElementById('filter-cat').value;
  const accF = document.getElementById('filter-acc').value;
  const periodF = document.getElementById('filter-period').value;

  const accSel = document.getElementById('filter-acc');
  const prev = accSel.value;
  accSel.innerHTML = '<option value="">Semua Akun</option>' +
    accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('');
  if (prev) accSel.value = prev;

  let list = [...transactions];
  if (search) list = list.filter(t => t.keterangan.toLowerCase().includes(search));
  if (typeF) list = list.filter(t => t.type === typeF);
  if (catF) list = list.filter(t => t.kategori === catF);
  if (accF) list = list.filter(t => t.accId === parseInt(accF));
  if (periodF === 'today') list = list.filter(t => isToday(t.date));
  if (periodF === 'week') list = list.filter(t => isThisWeek(t.date));
  if (periodF === 'month') list = list.filter(t => isThisMonth(t.date));

  const el = document.getElementById('history-list');
  el.innerHTML = list.length
    ? list.map(t => `<div style="position:relative" onmouseenter="this.querySelector('.del-btn').style.display='flex'" onmouseleave="this.querySelector('.del-btn').style.display='none'">
        ${txItemHTML(t)}
        <button onclick="deleteTx(${t.id})" class="del-btn" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:27px;height:27px;border-radius:50%;background:rgba(240,78,110,.1);border:none;cursor:pointer;font-size:.72rem;color:var(--expense);display:none;align-items:center;justify-content:center">✕</button>
      </div>`).join('')
    : '<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Tidak ada transaksi</div></div>';
}

function deleteTx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTx();
  renderHistory();
  renderDashboard();
  showToast('🗑️ Dihapus');
}

// ─── RENDER ACCOUNTS ───
function renderAccounts() {
  const el = document.getElementById('acc-list');
  el.innerHTML = accounts.length
    ? accounts.map((a, i) => {
        const bal = getAccBalance(a.id);
        const cnt = transactions.filter(t => t.accId === a.id).length;
        return `<div class="acc-card-big" style="animation-delay:${i * .07}s">
          <div class="acc-logo-big" style="background:${a.color}18">${a.icon}</div>
          <div style="flex:1"><div class="acc-card-name">${a.name}</div><div class="acc-card-num">${cnt} transaksi</div></div>
          <div><div class="acc-card-bal" style="color:${a.color}">${fmt(bal)}</div><div class="acc-card-type">Saldo saat ini</div></div>
        </div>`;
      }).join('')
    : '<div class="empty"><div class="empty-icon">💳</div><div class="empty-text">Belum ada akun</div></div>';
}

// ─── RENDER BUDGET PAGE ───
function renderBudgetPage() {
  const cats = ['saving', 'daily', 'lifestyle', 'play', 'lainnya'];
  cats.forEach(c => {
    const el = document.getElementById('budget-' + c);
    if (budgets[c]) el.value = 'Rp ' + budgets[c].toLocaleString('id-ID');
  });
  const el = document.getElementById('budget-progress-page');
  el.innerHTML = cats.map(c => {
    const limit = budgets[c] || 0;
    const spent = getBudgetSpent(c);
    const cfg = catCfg[c];
    const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
    return `<div class="budget-row">
      <div class="budget-head">
        <div class="budget-cat"><div class="budget-dot" style="background:${catColors[c]}"></div>${cfg.icon} ${cfg.label}</div>
        <div class="budget-pct" style="color:${pct >= 80 ? 'var(--expense)' : pct >= 50 ? 'var(--lifestyle)' : 'var(--income)'}">${Math.round(pct)}%</div>
      </div>
      <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${pct >= 80 ? 'var(--expense)' : pct >= 50 ? 'var(--lifestyle)' : catColors[c]}"></div></div>
      <div class="budget-foot"><span>${fmt(spent)}</span><span>${limit ? fmt(limit) : 'Belum diset'}</span></div>
    </div>`;
  }).join('');
}

function saveBudgets() {
  const cats = ['saving', 'daily', 'lifestyle', 'play', 'lainnya'];
  cats.forEach(c => { budgets[c] = getInputVal(document.getElementById('budget-' + c)); });
  saveBudgetStore();
  renderBudgetPage();
  renderDashboard();
  showToast('✅ Budget disimpan!');
}

// ─── RENDER SAVING PAGE ───
function renderSavingPage() {
  const savTx = transactions.filter(t => t.kategori === 'saving');
  const total = savTx.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
    - savTx.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0);
  const month = savTx.filter(t => t.type === 'masuk' && isThisMonth(t.date)).reduce((s, t) => s + t.amount, 0);

  document.getElementById('sv-total').textContent = fmt(total);
  document.getElementById('sv-month').textContent = fmt(month);
  document.getElementById('sv-target').textContent = budgets.saving ? fmt(budgets.saving) : 'Belum diset';

  const list = savTx.sort((a, b) => new Date(b.date) - new Date(a.date));
  const el = document.getElementById('saving-list');
  el.innerHTML = list.length
    ? list.map(t => txItemHTML(t)).join('')
    : '<div class="empty"><div class="empty-icon">🏦</div><div class="empty-text">Belum ada catatan</div></div>';
}

// ─── TOAST ───
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── CLOCK ───
function updateClock() {
  const el = document.getElementById('current-datetime');
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }) + ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
setInterval(updateClock, 1000);
updateClock();

// ─── INIT ───
renderDashboard();
