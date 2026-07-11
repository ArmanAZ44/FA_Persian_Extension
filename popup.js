document.addEventListener('DOMContentLoaded', async () => {
  const DEF = FaExtExclusions.DEFAULTS;

  const el = (id) => document.getElementById(id);
  const hostEl      = el('host');
  const statusPill  = el('statusPill');
  const enabledT    = el('enabledToggle');
  const fontT       = el('fontToggle');
  const rtlT        = el('rtlToggle');
  const digitT      = el('digitToggle');
  const scaleRange  = el('scaleRange');
  const scaleValue  = el('scaleValue');
  const resetSiteBtn= el('resetSiteBtn');
  const reloadBtn   = el('reloadBtn');
  const optionsBtn  = el('optionsBtn');
  const donateBtn   = el('donateBtn');
  const controls    = el('controls');
  const hardNote    = el('hardExcludedNote');
  const recNote     = el('recommendedNote');

  const faDigits = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  function getSettings() {
    return new Promise((resolve) =>
      chrome.storage.sync.get(Object.keys(DEF), (res) => resolve({ ...DEF, ...res })));
  }
  function saveSettings(partial) {
    return new Promise((resolve) => chrome.storage.sync.set(partial, resolve));
  }

  let host = '', tabId = null, settings = null;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try { host = new URL(tab.url).hostname; tabId = tab.id; } catch (e) { host = ''; }
  }
  hostEl.textContent = host || 'نامشخص';

  /* نوشتن یک کلید override برای دامنه‌ی جاری */
  async function setSiteKey(key, value) {
    const overrides = { ...(settings.faSiteOverrides || {}) };
    const site = { ...(overrides[host] || {}) };
    site[key] = value;
    overrides[host] = site;
    settings.faSiteOverrides = overrides;
    await saveSettings({ faSiteOverrides: overrides });
  }

  function refreshUI() {
    const eff = FaExtExclusions.resolveSite(settings, host);

    if (eff.hardExcluded) {
      hardNote.classList.add('show');
      recNote.classList.remove('show');
      controls.classList.add('disabled-fade');
      [enabledT, fontT, rtlT, digitT, scaleRange].forEach(c => c.disabled = true);
      statusPill.textContent = 'مستثنا';
      statusPill.className = 'status-badge off';
      return;
    }

    hardNote.classList.remove('show');
    recNote.classList.toggle('show', !!eff.isRecommended);

    enabledT.checked = eff.enabled;
    fontT.checked    = eff.font;
    rtlT.checked     = eff.rtl;
    digitT.checked   = eff.digit;
    scaleRange.value = eff.scale;
    scaleValue.textContent = faDigits(eff.scale) + '٪';

    // وقتی افزونه در این سایت خاموش است، بقیه‌ی کنترل‌ها معنا ندارند
    const off = !eff.enabled;
    [fontT, rtlT, digitT, scaleRange].forEach(c => c.disabled = off);

    if (!eff.enabled) {
      statusPill.textContent = 'غیرفعال';
      statusPill.className = 'status-badge off';
    } else if (eff.rtl) {
      statusPill.textContent = 'راست‌چین';
      statusPill.className = 'status-badge rtl';
    } else {
      statusPill.textContent = 'فقط فونت';
      statusPill.className = 'status-badge on';
    }
  }

  settings = await getSettings();
  refreshUI();

  enabledT.addEventListener('change', async () => { await setSiteKey('enabled', enabledT.checked); refreshUI(); });
  fontT.addEventListener('change',    async () => { await setSiteKey('font',    fontT.checked);    refreshUI(); });
  rtlT.addEventListener('change',     async () => { await setSiteKey('rtl',     rtlT.checked);     refreshUI(); });
  digitT.addEventListener('change',   async () => { await setSiteKey('digit',   digitT.checked);   refreshUI(); });

  scaleRange.addEventListener('input', () => { scaleValue.textContent = faDigits(scaleRange.value) + '٪'; });
  scaleRange.addEventListener('change', async () => { await setSiteKey('scale', parseInt(scaleRange.value, 10)); refreshUI(); });

  resetSiteBtn.addEventListener('click', async () => {
    const overrides = { ...(settings.faSiteOverrides || {}) };
    if (overrides[host]) { delete overrides[host]; settings.faSiteOverrides = overrides; await saveSettings({ faSiteOverrides: overrides }); }
    refreshUI();
  });

  reloadBtn.addEventListener('click', () => { if (tabId !== null) chrome.tabs.reload(tabId); window.close(); });
  optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  donateBtn.addEventListener('click', () => chrome.tabs.create({ url: 'https://reymit.ir/armanaz44' }));
  el('githubBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://github.com/ArmanAZ44/FA_Persian_Extension' }));
  el('telegramBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://t.me/ArmanAZPC' }));
});
