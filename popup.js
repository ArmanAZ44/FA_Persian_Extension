document.addEventListener('DOMContentLoaded', async () => {
  const DEF = FaExtExclusions.DEFAULTS;
  const FONTS = FaExtExclusions.FONTS || [];
  const PRESETS = FaExtExclusions.PRESETS || [];

  const el = (id) => document.getElementById(id);
  const faDigits = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const hostEl      = el('host');
  const statusPill  = el('statusPill');
  const enabledT    = el('enabledToggle');
  const fontT       = el('fontToggle');
  const rtlT        = el('rtlToggle');
  const digitT      = el('digitToggle');
  const scaleRange  = el('scaleRange');
  const scaleValue  = el('scaleValue');
  const fontSelect  = el('fontSelect');
  const weightSeg   = el('weightSeg');
  const presetsRow  = el('presetsRow');
  const previewFa   = el('previewFa');
  const favicon     = el('favicon');
  const copyHostBtn = el('copyHostBtn');
  const resetSiteBtn= el('resetSiteBtn');
  const reloadBtn   = el('reloadBtn');
  const applyAllBtn = el('applyAllBtn');
  const optionsBtn  = el('optionsBtn');
  const donateBtn   = el('donateBtn');
  const controls    = el('controls');
  const hardNote    = el('hardExcludedNote');
  const recNote     = el('recommendedNote');
  const recNoteText = recNote.textContent;

  const WEIGHT_MAP = { light: '300', normal: '400', bold: '700' };

  /* رنگ‌آمیزی مسیر اسلایدر تا محل دستگیره (فقط ظاهری) */
  function paintRange() {
    const min = Number(scaleRange.min), max = Number(scaleRange.max);
    const v = Number(scaleRange.value);
    const pct = max > min ? ((v - min) / (max - min)) * 100 : 50;
    scaleRange.style.setProperty('--fill', pct + '%');
  }

  function getSettings() {
    return new Promise((resolve) =>
      chrome.storage.sync.get(Object.keys(DEF), (res) => resolve({ ...DEF, ...res })));
  }
  function saveSettings(partial) {
    return new Promise((resolve) => chrome.storage.sync.set(partial, resolve));
  }

  /* ── فهرست فونت‌ها ── */
  FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.name + (f.note ? ' — ' + f.note : '');
    fontSelect.appendChild(o);
  });

  /* ── دکمه‌های پروفایل آماده ── */
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'preset';
    b.dataset.preset = p.id;
    b.textContent = p.name;
    b.title = p.desc || '';
    b.addEventListener('click', () => applyPreset(p));
    presetsRow.appendChild(b);
  });

  let host = '', tabId = null, tabUrl = '', settings = null;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try { host = new URL(tab.url).hostname; tabId = tab.id; tabUrl = tab.url; } catch (e) { host = ''; }
  }
  hostEl.textContent = host || 'نامشخص';

  /* ── فاوآیکون سایت (در فایرفاکس پشتیبانی نمی‌شود و خودکار پنهان می‌ماند) ── */
  (function initFavicon() {
    if (!tabUrl) return;
    try {
      favicon.onload = () => { favicon.style.display = ''; };
      favicon.onerror = () => { favicon.style.display = 'none'; };
      favicon.src = chrome.runtime.getURL('/_favicon/?pageUrl=' + encodeURIComponent(tabUrl) + '&size=32');
    } catch (e) { favicon.style.display = 'none'; }
  })();

  /* نوشتن یک کلید override برای دامنه‌ی جاری */
  async function setSiteKey(key, value) {
    if (!host) return;
    const overrides = { ...(settings.faSiteOverrides || {}) };
    const site = { ...(overrides[host] || {}) };
    site[key] = value;
    overrides[host] = site;
    settings.faSiteOverrides = overrides;
    await saveSettings({ faSiteOverrides: overrides });
  }

  /* ── پروفایل آماده: چند تنظیم را با هم برای همین سایت اعمال می‌کند ── */
  async function applyPreset(p) {
    if (!host) return;
    const overrides = { ...(settings.faSiteOverrides || {}) };
    overrides[host] = { ...(overrides[host] || {}), ...p.values };
    settings.faSiteOverrides = overrides;
    await saveSettings({ faSiteOverrides: overrides });
    refreshUI();
  }

  /* ── پیش‌نمایش زنده ── */
  function paintPreview(eff) {
    const font = FaExtExclusions.getFont(eff.fontFamily);
    const normalized = Math.min(1.32, Math.max(0.85, (eff.scale * 115) / 10000));
    previewFa.style.fontFamily = "'" + font.css + "', Tahoma, sans-serif";
    previewFa.style.fontSize = (normalized * 0.88).toFixed(3) + 'em';
    previewFa.style.fontWeight = WEIGHT_MAP[eff.fontWeight] || '';
    previewFa.style.lineHeight = eff.lineHeight > 0 ? (eff.lineHeight / 100).toFixed(2) : '';
    previewFa.style.letterSpacing = eff.letterSpacing > 0 ? (eff.letterSpacing / 100).toFixed(2) + 'em' : '0';
    previewFa.style.direction = eff.rtl ? 'rtl' : 'ltr';
    previewFa.style.textAlign = eff.rtl ? 'right' : 'left';
  }

  /* آیا تنظیمات فعلی سایت با یکی از پروفایل‌ها یکی است؟ */
  function activePresetId(eff) {
    for (const p of PRESETS) {
      const v = p.values;
      const same = (v.scale === undefined || v.scale === eff.scale) &&
        (v.lineHeight === undefined || v.lineHeight === eff.lineHeight) &&
        (v.letterSpacing === undefined || v.letterSpacing === eff.letterSpacing) &&
        (v.fontWeight === undefined || v.fontWeight === eff.fontWeight) &&
        (v.spacing === undefined || v.spacing === eff.spacing);
      if (same) return p.id;
    }
    return '';
  }

  function refreshUI() {
    if (!host) {
      hardNote.classList.remove('show');
      recNote.classList.remove('show');
      controls.classList.add('disabled-fade');
      [enabledT, fontT, rtlT, digitT, scaleRange, resetSiteBtn].forEach(c => c.disabled = true);
      statusPill.textContent = 'غیرفعال';
      statusPill.className = 'status-badge off';
      return;
    }

    const eff = FaExtExclusions.resolveSite(settings, host);

    if (eff.hardExcluded) {
      hardNote.classList.add('show');
      recNote.classList.remove('show');
      controls.classList.add('disabled-fade');
      [enabledT, fontT, rtlT, digitT, scaleRange, resetSiteBtn].forEach(c => c.disabled = true);
      statusPill.textContent = 'مستثنا';
      statusPill.className = 'status-badge off';
      return;
    }

    hardNote.classList.remove('show');

    /* توضیح حالت لیست سفید یا سایت پیشنهادی */
    if (eff.whitelistMode && !eff.enabled) {
      recNote.textContent = 'حالت «فقط سایت‌های انتخاب‌شده» روشن است و این سایت هنوز فعال نشده؛ با روشن‌کردن «فعال بودن افزونه در این سایت» به فهرست سفید اضافه می‌شود.';
      recNote.classList.add('show');
    } else {
      recNote.textContent = recNoteText;
      recNote.classList.toggle('show', !!eff.isRecommended);
    }

    enabledT.checked = eff.enabled;
    fontT.checked    = eff.font;
    rtlT.checked     = eff.rtl;
    digitT.checked   = eff.digit;
    scaleRange.value = eff.scale;
    scaleValue.textContent = faDigits(eff.scale) + '٪';
    paintRange();

    fontSelect.value = eff.fontFamily;
    weightSeg.querySelectorAll('.opt').forEach(o => {
      o.classList.toggle('active', o.dataset.weight === (eff.fontWeight || 'auto'));
    });

    const active = activePresetId(eff);
    presetsRow.querySelectorAll('.preset').forEach(b => {
      b.classList.toggle('active', b.dataset.preset === active);
    });

    paintPreview(eff);

    // وقتی افزونه در این سایت خاموش است، بقیه‌ی کنترل‌ها معنا ندارند
    const off = !eff.enabled;
    [fontT, rtlT, digitT, scaleRange, fontSelect].forEach(c => c.disabled = off);
    weightSeg.querySelectorAll('.opt').forEach(o => { o.style.pointerEvents = off ? 'none' : ''; o.style.opacity = off ? '.5' : ''; });

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

  fontSelect.addEventListener('change', async () => { await setSiteKey('fontFamily', fontSelect.value); refreshUI(); });

  weightSeg.querySelectorAll('.opt').forEach(o => o.addEventListener('click', async () => {
    await setSiteKey('fontWeight', o.dataset.weight);
    refreshUI();
  }));

  scaleRange.addEventListener('input', () => { scaleValue.textContent = faDigits(scaleRange.value) + '٪'; paintRange(); });
  scaleRange.addEventListener('change', async () => { await setSiteKey('scale', parseInt(scaleRange.value, 10)); refreshUI(); });

  resetSiteBtn.addEventListener('click', async () => {
    if (!host) return;
    const overrides = { ...(settings.faSiteOverrides || {}) };
    if (overrides[host]) { delete overrides[host]; settings.faSiteOverrides = overrides; await saveSettings({ faSiteOverrides: overrides }); }
    refreshUI();
  });

  reloadBtn.addEventListener('click', async () => {
    try {
      if (tabId !== null) await chrome.tabs.reload(tabId);
    } catch (e) {}
    window.close();
  });

  /* ── اعمال روی همه‌ی تب‌های باز ── */
  applyAllBtn.addEventListener('click', async () => {
    if (!confirm('همه‌ی تب‌های باز مرورگر بازخوانی شوند؟')) return;
    try {
      const tabs = await chrome.tabs.query({});
      for (const t of tabs) {
        if (t && t.id != null && /^https?:/i.test(t.url || '')) {
          try { await chrome.tabs.reload(t.id); } catch (e) {}
        }
      }
    } catch (e) {}
    window.close();
  });

  /* ── کپی دامنه ── */
  copyHostBtn.addEventListener('click', async () => {
    if (!host) return;
    try {
      await navigator.clipboard.writeText(host);
      copyHostBtn.textContent = '✓';
      setTimeout(() => { copyHostBtn.textContent = '⧉'; }, 1200);
    } catch (e) {}
  });

  optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  donateBtn.addEventListener('click', () => chrome.tabs.create({ url: 'https://reymit.ir/armanaz44' }));
  el('githubBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://github.com/ArmanAZ44/FA_Persian_Extension' }));
  el('telegramBtn').addEventListener('click', () => chrome.tabs.create({ url: 'https://t.me/ArmanAZPC' }));
});
