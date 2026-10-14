document.addEventListener('DOMContentLoaded', async () => {
  const DEF = FaExtExclusions.DEFAULTS;
  const FONTS = FaExtExclusions.FONTS || [];
  const PRESETS = FaExtExclusions.PRESETS || [];
  const el = (id) => document.getElementById(id);
  const faDigits = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const WEIGHT_MAP = { light: '300', normal: '400', bold: '700' };
  const PREVIEW_HOST = 'preview.invalid';   /* میزبان ساختگی: هیچ override ای ندارد */

  const masterToggle     = el('masterToggle');
  const fontDefaultT     = el('fontDefaultToggle');
  const rtlDefaultT      = el('rtlDefaultToggle');
  const scaleRange       = el('scaleRange');
  const scaleValue       = el('scaleValue');
  const fontFamilySelect = el('fontFamilySelect');
  const weightSeg        = el('weightSeg');
  const presetsRow       = el('presetsRow');
  const previewFa        = el('previewFa');
  const themeSeg         = el('themeSeg');
  const digitToggle      = el('digitToggle');
  const normalizeYKT     = el('normalizeYKToggle');
  const spacingToggle    = el('spacingToggle');
  const typographyToggle = el('typographyToggle');
  const translateToggle  = el('translateToggle');
  const hoverDictToggle  = el('hoverDictToggle');
  const whitelistToggle  = el('whitelistToggle');
  const autoBackupToggle = el('autoBackupToggle');
  const backupInfo       = el('backupInfo');
  const restoreBackupBtn = el('restoreBackupBtn');
  const lineHeightRange  = el('lineHeightRange');
  const lineHeightValue  = el('lineHeightValue');
  const letterSpacingRange = el('letterSpacingRange');
  const letterSpacingValue = el('letterSpacingValue');
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
  function getSettings() { return new Promise((r) => chrome.storage.sync.get(Object.keys(DEF), (res) => r({ ...DEF, ...(res || {}) }))); }
  function saveSettings(partial) { return new Promise((r) => chrome.storage.sync.set(partial, r)); }
  function normalizeHost(raw) { let v = (raw || '').trim(); if (!v) return ''; return v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase(); }

  function paintRange(input) {
    const min = Number(input.min), max = Number(input.max);
    const v = Number(input.value);
    const pct = max > min ? ((v - min) / (max - min)) * 100 : 50;
    input.style.setProperty('--fill', pct + '%');
  }

  let state = await getSettings();

  /* ── فهرست فونت‌ها ── */
  FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.name + (f.note ? ' — ' + f.note : '');
    fontFamilySelect.appendChild(o);
  });

  /* ── دکمه‌های پروفایل آماده ── */
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'preset';
    b.dataset.preset = p.id;
    b.innerHTML = '<div class="p-name"></div><div class="p-desc"></div>';
    b.querySelector('.p-name').textContent = p.name;
    b.querySelector('.p-desc').textContent = p.desc || '';
    b.addEventListener('click', async () => {
      state = { ...state, ...p.values };
      await saveSettings(p.values);
      hydrate();
      showToast('پروفایل «' + p.name + '» اعمال شد');
    });
    presetsRow.appendChild(b);
  });

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
    node.addEventListener('change', async () => {
      state[key] = node.checked;
      await saveSettings({ [key]: state[key] });
      if (key === 'faWhitelistMode') renderStats();
      showToast(msg || 'ذخیره شد');
    });
  }
  bindToggle(masterToggle, 'faEnabled');
  bindToggle(fontDefaultT, 'faFontEnabled');
  bindToggle(rtlDefaultT, 'faRtlDefault');
  bindToggle(digitToggle, 'faDigitConvert');
  bindToggle(normalizeYKT, 'faNormalizeYK');
  bindToggle(spacingToggle, 'faSpacingEnabled');
  bindToggle(typographyToggle, 'faTypography');
  bindToggle(translateToggle, 'faTranslateHotkey');
  bindToggle(hoverDictToggle, 'faHoverDictEnabled');
  bindToggle(whitelistToggle, 'faWhitelistMode');
  bindToggle(autoBackupToggle, 'faAutoBackup');

  /* ── مقیاس ── */
  scaleRange.addEventListener('input', () => { scaleValue.textContent = faDigits(scaleRange.value) + '٪'; paintRange(scaleRange); renderPreview(); });
  scaleRange.addEventListener('change', async () => {
    state.faFontScale = parseInt(scaleRange.value, 10);
    await saveSettings({ faFontScale: state.faFontScale });
    showToast('مقیاس فونت ذخیره شد');
  });

  /* ── فونت و ضخامت ── */
  fontFamilySelect.addEventListener('change', async () => {
    state.faFontFamily = fontFamilySelect.value;
    await saveSettings({ faFontFamily: state.faFontFamily });
    renderPreview(); showToast('فونت ذخیره شد');
  });
  weightSeg.querySelectorAll('.opt').forEach(o => o.addEventListener('click', async () => {
    state.faFontWeight = o.dataset.weight;
    await saveSettings({ faFontWeight: state.faFontWeight });
    hydrate(); showToast('ضخامت فونت ذخیره شد');
  }));

  /* ── فاصله‌ی خط و حروف ── */
  function fmtLineHeight(v) { return v > 0 ? faDigits((v / 100).toFixed(2)) : 'خودکار'; }
  function fmtLetterSpacing(v) { return v > 0 ? faDigits((v / 100).toFixed(2)) + ' em' : 'خودکار'; }

  lineHeightRange.addEventListener('input', () => {
    lineHeightValue.textContent = fmtLineHeight(Number(lineHeightRange.value));
    paintRange(lineHeightRange); renderPreview();
  });
  lineHeightRange.addEventListener('change', async () => {
    state.faLineHeight = parseInt(lineHeightRange.value, 10);
    await saveSettings({ faLineHeight: state.faLineHeight });
    showToast('فاصله‌ی خط ذخیره شد');
  });

  letterSpacingRange.addEventListener('input', () => {
    letterSpacingValue.textContent = fmtLetterSpacing(Number(letterSpacingRange.value));
    paintRange(letterSpacingRange); renderPreview();
  });
  letterSpacingRange.addEventListener('change', async () => {
    state.faLetterSpacing = parseInt(letterSpacingRange.value, 10);
    await saveSettings({ faLetterSpacing: state.faLetterSpacing });
    showToast('فاصله‌ی حروف ذخیره شد');
  });

  /* ── پیش‌نمایش زنده ── */
  function renderPreview() {
    const eff = FaExtExclusions.resolveSite(state, PREVIEW_HOST);
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

  function activePresetId() {
    for (const p of PRESETS) {
      const v = p.values;
      const same = (v.scale === undefined || v.scale === state.faFontScale) &&
        (v.lineHeight === undefined || v.lineHeight === state.faLineHeight) &&
        (v.letterSpacing === undefined || v.letterSpacing === state.faLetterSpacing) &&
        (v.fontWeight === undefined || v.fontWeight === state.faFontWeight) &&
        (v.spacing === undefined || v.spacing === state.faSpacingEnabled);
      if (same) return p.id;
    }
    return '';
  }

  /* ── فهرست override سایت‌ها ── */
  const KEY_LABELS = {
    enabled: (v) => v ? 'فعال' : 'غیرفعال در این سایت',
    font: (v) => v ? 'فونت روشن' : 'فونت خاموش',
    rtl: (v) => v ? 'راست‌چین' : 'بدون راست‌چین',
    digit: (v) => v ? 'ارقام فارسی' : 'ارقام لاتین',
    typography: (v) => v ? 'تایپوگرافی' : null,
    normalizeYK: (v) => v ? 'نرمال‌سازی ي/ك' : null,
    spacing: (v) => v ? 'اصلاح فاصله' : 'بدون اصلاح فاصله',
    scale: (v) => 'مقیاس ' + faDigits(v) + '٪',
    fontFamily: (v) => 'فونت ' + (FaExtExclusions.getFont(v).name),
    fontWeight: (v) => v === 'auto' ? null : 'ضخامت ' + ({ light: 'نازک', normal: 'معمولی', bold: 'ضخیم' }[v] || v),
    lineHeight: (v) => v > 0 ? 'فاصله خط ' + faDigits((v / 100).toFixed(2)) : null,
    letterSpacing: (v) => v > 0 ? 'فاصله حروف ' + faDigits((v / 100).toFixed(2)) : null
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
    if (FaExtExclusions.isHardExcluded(h)) {
      showToast('این دامنه همیشه مستثنا (ایرانی) است و تغییری نمی‌پذیرد.');
      return;
    }
    const o = { ...(state.faSiteOverrides || {}) };
    o[h] = { ...(o[h] || {}), enabled: true, rtl: true };
    state.faSiteOverrides = o; await saveSettings({ faSiteOverrides: o });
    siteInput.value = ''; renderSites(); renderStats(); showToast('سایت اضافه شد (فعال + راست‌چین)');
  });
  siteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addSiteBtn.click(); });

  /* ── سلکتورها ── */
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

  /* ── پشتیبان‌گیری خودکار ── */
  function renderBackupInfo() {
    chrome.storage.local.get(['faAutoBackup'], (res) => {
      const b = res && res.faAutoBackup;
      if (!b || !b.savedAt) { backupInfo.textContent = 'هنوز نسخه‌ای ثبت نشده است.'; return; }
      let when = '';
      try { when = new Date(b.savedAt).toLocaleString('fa-IR'); } catch (e) { when = String(b.savedAt); }
      backupInfo.textContent = 'آخرین نسخه: ' + when + ' — ' + faDigits(Object.keys(b.settings || {}).length) + ' کلید';
    });
  }
  restoreBackupBtn.addEventListener('click', () => {
    chrome.storage.local.get(['faAutoBackup'], async (res) => {
      const b = res && res.faAutoBackup;
      if (!b || !b.settings) { showToast('نسخه‌ی پشتیبانی وجود ندارد'); return; }
      if (!confirm('تنظیمات فعلی با آخرین نسخه‌ی پشتیبان جایگزین شود؟')) return;
      state = { ...DEF, ...b.settings };
      await saveSettings(state);
      hydrate(); showToast('از نسخه‌ی پشتیبان بازگردانی شد');
    });
  });

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
    normalizeYKT.checked = !!state.faNormalizeYK;
    spacingToggle.checked = !!state.faSpacingEnabled;
    typographyToggle.checked = !!state.faTypography;
    translateToggle.checked = !!state.faTranslateHotkey;
    hoverDictToggle.checked = !!state.faHoverDictEnabled;
    whitelistToggle.checked = !!state.faWhitelistMode;
    autoBackupToggle.checked = state.faAutoBackup !== false;

    scaleRange.value = state.faFontScale;
    scaleValue.textContent = faDigits(state.faFontScale) + '٪';
    paintRange(scaleRange);

    fontFamilySelect.value = state.faFontFamily || 'vazirmatn';
    weightSeg.querySelectorAll('.opt').forEach(o => o.classList.toggle('active', o.dataset.weight === (state.faFontWeight || 'auto')));

    lineHeightRange.value = state.faLineHeight || 0;
    lineHeightValue.textContent = fmtLineHeight(Number(lineHeightRange.value));
    paintRange(lineHeightRange);

    letterSpacingRange.value = state.faLetterSpacing || 0;
    letterSpacingValue.textContent = fmtLetterSpacing(Number(letterSpacingRange.value));
    paintRange(letterSpacingRange);

    presetsRow.querySelectorAll('.preset').forEach(b => b.classList.toggle('active', b.dataset.preset === activePresetId()));

    selectorsArea.value = (state.faExcludeSelectors || []).join('\n');
    renderTheme(); renderSites(); renderStats(); renderPreview(); renderBackupInfo();
  }

  hydrate();
});
