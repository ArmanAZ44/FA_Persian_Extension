document.addEventListener('DOMContentLoaded', async () => {
  const DEF = FaExtExclusions.DEFAULTS;
  const el = (id) => document.getElementById(id);
  const faDigits = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const masterToggle    = el('masterToggle');
  const fontDefaultT     = el('fontDefaultToggle');
  const rtlDefaultT      = el('rtlDefaultToggle');
  const scaleRange       = el('scaleRange');
  const scaleValue       = el('scaleValue');
  const themeSeg         = el('themeSeg');
  const digitToggle      = el('digitToggle');
  const spacingToggle    = el('spacingToggle');
  const typographyToggle = el('typographyToggle');
  const translateToggle  = el('translateToggle');
  const hoverDictToggle  = el('hoverDictToggle');
  const siteInput        = el('siteInput');
  const addSiteBtn       = el('addSiteBtn');
  const siteList         = el('siteList');
  const siteEmpty        = el('siteEmpty');
  const selectorsArea    = el('selectorsArea');
  const saveSelectorsBtn = el('saveSelectorsBtn');
  const exportBtn        = el('exportBtn');
  const importBtn        = el('importBtn');
  const importFile       = el('importFile');
  const resetBtn         = el('resetBtn');
  const donateBtn        = el('donateBtn');
  const toast            = el('toast');
  const statOverrides    = el('statOverrides');
  const statSelectors    = el('statSelectors');

  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1700); }
  function getSettings() { return new Promise((r) => chrome.storage.sync.get(Object.keys(DEF), (res) => r({ ...DEF, ...res }))); }
  function saveSettings(partial) { return new Promise((r) => chrome.storage.sync.set(partial, r)); }
  function normalizeHost(raw) { let v = (raw || '').trim(); if (!v) return ''; return v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase(); }

  let state = await getSettings();

  /* ── پوسته ── */
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  function renderTheme() {
    themeSeg.querySelectorAll('.opt').forEach(o => o.classList.toggle('active', o.dataset.theme === (state.faTheme || 'auto')));
    applyTheme(state.faTheme || 'auto');
  }
  themeSeg.querySelectorAll('.opt').forEach(o => o.addEventListener('click', async () => {
    state.faTheme = o.dataset.theme; await saveSettings({ faTheme: state.faTheme }); renderTheme(); showToast('پوسته تغییر کرد');
  }));

  /* ── تب‌ها ── */
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    el('tab-' + btn.dataset.tab).classList.add('active');
  }));

  /* ── سوییچ‌های سراسری ── */
  function bindToggle(node, key, msg) {
    node.checked = !!state[key];
    node.addEventListener('change', async () => { state[key] = node.checked; await saveSettings({ [key]: state[key] }); showToast(msg || 'ذخیره شد'); });
  }
  bindToggle(masterToggle, 'faEnabled');
  bindToggle(fontDefaultT, 'faFontEnabled');
  bindToggle(rtlDefaultT, 'faRtlDefault');
  bindToggle(digitToggle, 'faDigitConvert');
  bindToggle(spacingToggle, 'faSpacingEnabled');
  bindToggle(typographyToggle, 'faTypography');
  bindToggle(translateToggle, 'faTranslateHotkey');
  bindToggle(hoverDictToggle, 'faHoverDictEnabled');

  /* ── مقیاس ── */
  scaleRange.value = state.faFontScale;
  scaleValue.textContent = faDigits(state.faFontScale) + '٪';
  scaleRange.addEventListener('input', () => { scaleValue.textContent = faDigits(scaleRange.value) + '٪'; });
  scaleRange.addEventListener('change', async () => { state.faFontScale = parseInt(scaleRange.value, 10); await saveSettings({ faFontScale: state.faFontScale }); showToast('مقیاس فونت ذخیره شد'); });

  /* ── فهرست override سایت‌ها ── */
  const KEY_LABELS = {
    enabled: (v) => v ? 'فعال' : 'غیرفعال در این سایت',
    font: (v) => v ? 'فونت روشن' : 'فونت خاموش',
    rtl: (v) => v ? 'راست‌چین' : 'بدون راست‌چین',
    digit: (v) => v ? 'ارقام فارسی' : 'ارقام لاتین',
    typography: (v) => v ? 'تایپوگرافی' : null,
    spacing: (v) => v ? 'اصلاح فاصله' : 'بدون اصلاح فاصله',
    scale: (v) => 'مقیاس ' + faDigits(v) + '٪'
  };

  function renderSites() {
    const ov = state.faSiteOverrides || {};
    const hosts = Object.keys(ov);
    siteList.innerHTML = '';
    siteEmpty.style.display = hosts.length ? 'none' : 'block';
    hosts.sort().forEach((h) => {
      const cfg = ov[h] || {};
      const item = document.createElement('div');
      item.className = 'site-item';
      const left = document.createElement('div');
      const host = document.createElement('div'); host.className = 'host'; host.textContent = h;
      const chips = document.createElement('div'); chips.className = 'chips';
      Object.keys(cfg).forEach((k) => {
        const labeler = KEY_LABELS[k]; if (!labeler) return;
        const label = labeler(cfg[k]); if (!label) return;
        const chip = document.createElement('span');
        const isOff = (k === 'enabled' && !cfg[k]) || (k === 'font' && !cfg[k]);
        chip.className = 'chip' + (isOff ? ' off' : '');
        chip.textContent = label; chips.appendChild(chip);
      });
      left.appendChild(host); left.appendChild(chips);
      const rm = document.createElement('button'); rm.className = 'rm'; rm.textContent = '✕'; rm.title = 'حذف تنظیم این سایت';
      rm.addEventListener('click', async () => {
        const o = { ...(state.faSiteOverrides || {}) }; delete o[h]; state.faSiteOverrides = o;
        await saveSettings({ faSiteOverrides: o }); renderSites(); renderStats(); showToast('حذف شد');
      });
      item.appendChild(left); item.appendChild(rm); siteList.appendChild(item);
    });
  }

  addSiteBtn.addEventListener('click', async () => {
    const h = normalizeHost(siteInput.value); if (!h) return;
    const o = { ...(state.faSiteOverrides || {}) };
    o[h] = { ...(o[h] || {}), rtl: true };
    state.faSiteOverrides = o; await saveSettings({ faSiteOverrides: o });
    siteInput.value = ''; renderSites(); renderStats(); showToast('سایت اضافه شد (راست‌چین روشن)');
  });
  siteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addSiteBtn.click(); });

  /* ── سلکتورها ── */
  selectorsArea.value = (state.faExcludeSelectors || []).join('\n');
  saveSelectorsBtn.addEventListener('click', async () => {
    const selectors = selectorsArea.value.split('\n').map((s) => s.trim()).filter(Boolean);
    state.faExcludeSelectors = selectors; await saveSettings({ faExcludeSelectors: selectors });
    renderStats(); showToast('سلکتورها ذخیره شد');
  });

  /* ── آمار ── */
  function renderStats() {
    statOverrides.textContent = faDigits(Object.keys(state.faSiteOverrides || {}).length);
    statSelectors.textContent = faDigits((state.faExcludeSelectors || []).filter(Boolean).length);
  }

  /* ── خروجی / ورودی ── */
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'fa-extension-settings.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('فایل تنظیمات دانلود شد');
  });
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    const file = importFile.files && importFile.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const merged = { ...DEF, ...JSON.parse(reader.result) };
        state = merged; await saveSettings(merged); hydrate(); showToast('تنظیمات با موفقیت وارد شد');
      } catch (e) { showToast('فایل نامعتبر است'); }
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  /* ── بازگردانی ── */
  resetBtn.addEventListener('click', async () => {
    if (!confirm('همه تنظیمات به حالت پیش‌فرض برگردند؟')) return;
    state = JSON.parse(JSON.stringify(DEF)); await saveSettings(state); hydrate(); showToast('بازگردانی شد');
  });

  donateBtn.addEventListener('click', () => chrome.tabs.create({ url: 'https://reymit.ir/armanaz44' }));
  el('githubBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://github.com/ArmanAZ44/FA_Persian_Extension' }));
  el('telegramBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://t.me/ArmanAZPC' }));

  /* ── هم‌گام‌سازی کامل UI با state ── */
  function hydrate() {
    masterToggle.checked = !!state.faEnabled;
    fontDefaultT.checked = !!state.faFontEnabled;
    rtlDefaultT.checked = !!state.faRtlDefault;
    digitToggle.checked = !!state.faDigitConvert;
    spacingToggle.checked = !!state.faSpacingEnabled;
    typographyToggle.checked = !!state.faTypography;
    translateToggle.checked = !!state.faTranslateHotkey;
    hoverDictToggle.checked = !!state.faHoverDictEnabled;
    scaleRange.value = state.faFontScale;
    scaleValue.textContent = faDigits(state.faFontScale) + '٪';
    selectorsArea.value = (state.faExcludeSelectors || []).join('\n');
    renderTheme(); renderSites(); renderStats();
  }

  renderTheme();
  renderSites();
  renderStats();
});
