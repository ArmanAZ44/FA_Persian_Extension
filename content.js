/**
 * فا | راست‌چین‌ساز و فونت فارسی
 * نسخه ۱.۰.۰ — بازنویسی معماری
 *
 * اصل بنیادین این نسخه:
 *   فونت فارسی هرگز روی body / html / یک عنصر سراسری اعمال نمی‌شود.
 *   تنها و تنها روی <span class="fa-ext-fa"> هایی که خودِ اسکریپت
 *   دقیقاً دور بخش‌های فارسیِ یک text node پیچیده، اعمال می‌شود.
 *   نتیجه: فونت انگلیسی سایت تحت هیچ شرایطی تغییر نمی‌کند.
 *
 * تغییرات نسخه ۱.۰.۰:
 *   - اندازه هوشمند فونت فارسی بر اساس نوع عنصر (h1-h6, p, button, label, ...)
 *   - تشخیص بولد/نرمال بودن متن والد و تطبیق وزن فونت
 *   - کاهش فاصله خطوط (line-height 1.3)
 *   - فونت فارسی کمی کوچیک‌تر از دیفالت
 *   - رفع باگ اعمال نشدن روی کلمات تک‌حرف فارسی
 *   - رفع باگ راستچین نشدن کلمات تک‌حرف
 *   - رفع باگ اعمال نشدن روی بعضی سایت‌ها (نیاز به رفرش)
 *   - خروج سرویس‌های گوگل از لیست سیاه
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────────────
   * خروج فوری برای سایت‌های مستثنا
   * این بررسی باید همیشه اولین کاری باشد که اسکریپت انجام می‌دهد. */
  if (typeof FaExtExclusions !== 'undefined' && FaExtExclusions.isHardExcluded(location.hostname)) {
    return;
  }

  /* رفع باگ «سایت لود نمی‌شود / ارور می‌خورد»:
     این افزونه با all_frames روی هر فریمی (از جمله فریم‌های XML، JSON، PDF
     viewer داخلی کروم و صفحات غیر HTML) اجرا می‌شود. دستکاری DOM روی
     سندهای غیر HTML می‌تواند خطا پرتاب کند و صفحه را خراب نشان دهد.
     بنابراین روی هر سندی که واقعاً HTML نیست، اسکریپت بی‌سروصدا متوقف می‌شود. */
  if (document.contentType && document.contentType !== 'text/html') {
    return;
  }

  const STYLE_ID         = 'fa-ext-styles';
  const ALIGN_CLASS       = 'fa-ext-align';
  const FONT_SPAN_CLASS   = 'fa-ext-fa';
  const HTML_RTL_CLASS    = 'fa-ext-rtl-on';
  const HTML_FONT_CLASS   = 'fa-ext-font-on';
  const FORM_FONT_CLASS   = 'fa-ext-form-fa';

  const PERSIAN_RE      = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const LATIN_RE         = /[A-Za-z]/;
  const DIGIT_RE         = /[0-9]/;
  const WORD_SPLIT_RE    = /\S+/g;
  const DIGIT_GLOBAL_RE  = /[0-9]/g;
  const TOKEN_RE         = /\s+|[^\s]+/g;

  const DIGIT_MAP = { '0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹' };

  const NEVER_TOUCH_TAGS = new Set([
    'SCRIPT','STYLE','NOSCRIPT','TEMPLATE',
    'SVG','MATH','CANVAS','IMG','PICTURE','VIDEO','AUDIO','IFRAME',
    'CODE','PRE','KBD','SAMP','VAR','OBJECT','EMBED'
  ]);

  const EDITABLE_TAGS = new Set(['INPUT','TEXTAREA','SELECT','OPTION']);

  const EDITABLE_SELECTOR =
    '[contenteditable]:not([contenteditable="false"]), ' +
    '.monaco-editor, .CodeMirror, .cm-editor, .ace_editor, ' +
    '.tox-edit-area, .tox-editor-container, .ql-editor, .cke, .cke_editable, ' +
    '[data-slate-editor], .ProseMirror, .DraftEditor-root, .public-DraftEditor-content';

  /* کلاس فونت/راست‌چین برای ویرایشگرهای contenteditable هنگام تایپ */
  const EDIT_FONT_CLASS = 'fa-ext-edit-fa';
  /* ویرایشگرهای کد که هرگز نباید فارسی یا راست‌چین شوند */
  const CODE_EDITOR_SELECTOR = '.monaco-editor, .CodeMirror, .cm-editor, .ace_editor, code, pre';

  const ICON_SELECTOR =
    '.material-icons, .material-icons-outlined, .material-icons-round, ' +
    '.material-icons-sharp, .material-icons-two-tone, ' +
    '.material-symbols-outlined, .material-symbols-rounded, .material-symbols-sharp, ' +
    '.fa, .fas, .far, .fab, .fal, .fad, .fi, .bi, .lucide, .remixicon, ' +
    '[class^="ri-"], [class*=" ri-"], [class*="icon-"], [class^="icon"], ' +
    '[class*=" icon"], [data-icon], [aria-hidden="true"]';

  const SAFE_BLOCK_DISPLAYS = new Set(['block','inline-block','list-item','table-cell','table-caption']);

  const FONT_FAMILY = 'FaExtVazirmatn';
  const FONT_FILES  = { 400:'Vazirmatn-Regular.woff2', 500:'Vazirmatn-Medium.woff2', 700:'Vazirmatn-Bold.woff2' };

  const DEF = FaExtExclusions.DEFAULTS;

  let settings = { ...DEF };
  const host   = location.hostname;

  /* تنظیمات مؤثر برای این دامنه (با درنظرگرفتن override اختصاصی سایت).
     منطق تفکیک به‌طور کامل در exclusions.js متمرکز است. */
  let eff = FaExtExclusions.resolveSite(settings, host);
  function recomputeEff() {
    eff = FaExtExclusions.resolveSite(settings, host);
  }

  /* افزونه روی این سایت فعال است؟ (کلید اصلی روشن و دامنه مستثنای سخت نباشد) */
  function masterActive() {
    return eff.enabled && !eff.hardExcluded;
  }

  function convertDigitsSmart(text) {
    if (!eff.digit || !DIGIT_RE.test(text) || !PERSIAN_RE.test(text)) return text;
    return text.replace(WORD_SPLIT_RE, word => {
      if (!DIGIT_RE.test(word) || LATIN_RE.test(word)) return word;
      return word.replace(DIGIT_GLOBAL_RE, d => DIGIT_MAP[d]);
    });
  }

  const HALF_SPACE   = '\u200c';
  const SUFFIX_RE    = /([\u0622-\u06cc\u0621])[ ]+(\u0647\u0627|\u0647\u0627\u06cc|\u0647\u0627\u06cc\u06cc|\u062a\u0631|\u062a\u0631\u06cc\u0646|\u0627\u0645|\u0627\u06cc|\u0627\u0634|\u0645\u0627\u0646|\u062a\u0627\u0646|\u0634\u0627\u0646)(?=[\s.,!?\u061b\u061f)\u00bb\]]|$)/g;
  const PREFIX_MI_RE = /(^|[\s(\u00ab\[])(\u0645\u06cc|\u0646\u0645\u06cc)[ ]+([\u0622-\u06cc])/g;
  const YE_RE        = /([\u0622-\u06cc])[ ]+\u06cc[ ]/g;
  const PUNCT_MAP    = [[/\?/g,'\u061f'],[/;/g,'\u061b'],[/,(\s|$)/g,'\u060c$1']];
  const QUOTE_RE     = /"([^"\n]+)"/g;

  function applyTypography(text) {
    if (!eff.typography || !PERSIAN_RE.test(text)) return text;
    let o = text;
    o = o.replace(SUFFIX_RE,    (m,ch,suf) => ch + HALF_SPACE + suf);
    o = o.replace(PREFIX_MI_RE, (m,pre,mi,next) => pre + mi + HALF_SPACE + next);
    o = o.replace(YE_RE,        (m,ch) => ch + HALF_SPACE + '\u06cc ');
    o = o.replace(QUOTE_RE,     '\u00ab$1\u00bb');
    for (const [pat, rep] of PUNCT_MAP) o = o.replace(pat, rep);
    return o;
  }

  /* ──────────────────────────────────────────────────────────────────────
   * اندازه هوشمند فونت فارسی
   *
   * Vazirmatn نسبت به فونت‌های لاتین معمول کمی درشت‌تر است. برای جبران،
   * فونت فارسی به‌صورت هوشمند بر اساس نوع عنصر والد scale می‌شود:
   *
   *   h1-h3  → scale × 0.92  (تیترها کمی کوچیک‌تر)
   *   h4-h6  → scale × 0.90
   *   p, li, span, a, td, div → scale × 0.88  (متن عادی)
   *   button, label, small, sub, sup → scale × 0.86  (عناصر کوچک)
   *   input, textarea, select, option → scale × 0.88
   *
   * همچنین وزن فونت (font-weight) از عنصر والد به ارث برده می‌شود تا
   * متن بولد فارسی هم بولد بماند و نرمال هم نرمال. */
  const SMART_SCALE_MAP = {
    'H1': 0.92, 'H2': 0.92, 'H3': 0.92,
    'H4': 0.90, 'H5': 0.90, 'H6': 0.90,
    'P': 0.88, 'LI': 0.88, 'SPAN': 0.88, 'A': 0.88,
    'TD': 0.88, 'TH': 0.88, 'DIV': 0.88,
    'BUTTON': 0.86, 'LABEL': 0.86, 'SMALL': 0.86,
    'SUB': 0.86, 'SUP': 0.86,
    'INPUT': 0.88, 'TEXTAREA': 0.88, 'SELECT': 0.88, 'OPTION': 0.88,
    'STRONG': 0.88, 'B': 0.88, 'EM': 0.88, 'I': 0.88,
    'CAPTION': 0.86, 'FIGCAPTION': 0.86, 'BLOCKQUOTE': 0.88,
    'DT': 0.88, 'DD': 0.88, 'SUMMARY': 0.88
  };

  const DEFAULT_SMART_SCALE = 0.88;

  /* تشخیص scale هوشمند برای یک عنصر والد */
  function getSmartScale(parentTag) {
    return SMART_SCALE_MAP[parentTag] || DEFAULT_SMART_SCALE;
  }

  /* قانون طلایی: هیچ selector ای بزرگ‌تر از «.fa-ext-fa» فونت فارسی
   * نمی‌گیرد. هیچ قانونی روی body/html/* وجود ندارد. */
  function buildCss() {
    const faces = Object.entries(FONT_FILES).map(([w, file]) => {
      const url = chrome.runtime.getURL('fonts/' + file);
      return `@font-face {
        font-family: '${FONT_FAMILY}';
        src: url('${url}') format('woff2');
        font-weight: ${w};
        font-display: swap;
        unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF;
      }`;
    }).join('\n');

    /* مقیاس پایه از تنظیمات کاربر (85 تا 130 درصد).
       مقدار 100 یعنی بدون تغییر کاربر. scale نهایی = normalized × smartScale.
       چون Vazirmatn کمی درشت‌تر است، smartScale ها همه زیر 1 هستند. */
    const normalized = Math.min(1.3, Math.max(0.85, (eff.scale || 90) / 100));

    /* اصلاح محافظه‌کارانه‌ی فاصله‌ها — فقط وقتی faSpacingEnabled روشن باشد.
       line-height ملایم (۱٫۳۵) و word-spacing نرمال تا UI سایت خراب نشود. */
    const spacingCss = eff.spacing
      ? `line-height: 1.35 !important; word-spacing: normal !important;`
      : ``;

    /* ساخت قوانین CSS برای هر تگ والد با scale هوشمند */
    const tagRules = Object.entries(SMART_SCALE_MAP).map(([tag, smartScale]) => {
      const finalScale = (normalized * smartScale).toFixed(4);
      return `html.${HTML_FONT_CLASS} ${tag.toLowerCase()} .${FONT_SPAN_CLASS} {
        font-size: ${finalScale}em !important;
      }`;
    }).join('\n');

    /* قانون پیش‌فرض برای تگ‌های خارج از جدول */
    const defaultScale = (normalized * DEFAULT_SMART_SCALE).toFixed(4);
    const defaultRule = `html.${HTML_FONT_CLASS} .${FONT_SPAN_CLASS} {
      font-size: ${defaultScale}em !important;
    }`;

    return `
      ${faces}

      /* ── فونت فارسی فقط روی span های فارسی اعمال می‌شود ──
         تنها font-family و letter-spacing تغییر می‌کند. تمام خواص دیگر
         (وزن، رنگ، حاشیه، position، layout) دقیقاً از سایت به ارث برده می‌شوند.
         font-size به‌صورت هوشمند بر اساس تگ والد تعیین می‌شود.
         font-weight از والد به ارث برده می‌شود (بولد/نرمال حفظ می‌شود). */
      html.${HTML_FONT_CLASS} .${FONT_SPAN_CLASS} {
        font-family: '${FONT_FAMILY}', Tahoma, Arial, sans-serif !important;
        letter-spacing: 0 !important;
        ${spacingCss}
      }

      /* ── مقیاس هوشمند بر اساس نوع عنصر ── */
      ${defaultRule}
      ${tagRules}

      /* ── فیلدهای فرم: font-family مستقیم روی عنصر ── */
      html.${HTML_FONT_CLASS} .${FORM_FONT_CLASS} {
        font-family: '${FONT_FAMILY}', Tahoma, Arial, sans-serif !important;
        letter-spacing: 0 !important;
        font-size: ${defaultScale}em !important;
        ${spacingCss}
      }
      html.${HTML_RTL_CLASS} .${FORM_FONT_CLASS} {
        direction: rtl;
      }
      html.${HTML_RTL_CLASS} input.${FORM_FONT_CLASS},
      html.${HTML_RTL_CLASS} textarea.${FORM_FONT_CLASS} {
        text-align: right;
      }

      /* ── راست‌چین: فقط روی برگه‌های متنی فارسی‌غالب ── */
      /* ── ویرایشگرهای contenteditable هنگام تایپ (فونت + راست‌چین) ── */
      html.${HTML_FONT_CLASS} .${EDIT_FONT_CLASS} {
        font-family: '${FONT_FAMILY}', Tahoma, Arial, sans-serif !important;
        ${spacingCss}
      }
      html.${HTML_RTL_CLASS} .${EDIT_FONT_CLASS} {
        direction: rtl !important;
        text-align: right !important;
      }

      html.${HTML_RTL_CLASS} .${ALIGN_CLASS} {
        direction: rtl;
        text-align: right;
      }

      /* ── ایزوله‌ی bidi: جهت صحیح گلیف‌های فارسی ── */
      .${FONT_SPAN_CLASS} { unicode-bidi: isolate; }
    `;
  }

  const mainStyleEl = document.createElement('style');
  mainStyleEl.id = STYLE_ID;

  function injectMainStyles() {
    mainStyleEl.textContent = buildCss();
    if (!mainStyleEl.isConnected) {
      (document.head || document.documentElement).appendChild(mainStyleEl);
    }
  }

  const styledShadowRoots = new WeakSet();
  function injectStylesIntoShadow(root) {
    if (styledShadowRoots.has(root)) return;
    styledShadowRoots.add(root);
    const el = document.createElement('style');
    el.textContent = buildCss();
    root.appendChild(el);
  }

  function applyHtmlClasses() {
    const root = document.documentElement;
    if (!root) return;
    const active = masterActive();
    root.classList.toggle(HTML_RTL_CLASS, active && eff.rtl);
    root.classList.toggle(HTML_FONT_CLASS, active && eff.font);
  }

  function preloadFonts() {
    try {
      if (!document.fonts || !document.fonts.add) return Promise.resolve();
      const promises = Object.entries(FONT_FILES).map(([weight, file]) => {
        const url = `url('${chrome.runtime.getURL('fonts/' + file)}')`;
        const face = new FontFace(FONT_FAMILY, url, {
          weight: String(weight),
          unicodeRange: 'U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF',
          display: 'swap'
        });
        /* رفع باگ: فونت باید ابتدا بارگذاری و سپس افزوده شود (load-then-add). */
        return face.load().then(loaded => { document.fonts.add(loaded); }).catch(() => {});
      });
      return Promise.race([
        Promise.all(promises),
        new Promise(res => setTimeout(res, 500))
      ]);
    } catch (e) {
      return Promise.resolve();
    }
  }

  const displayCache = new WeakMap();
  function getDisplayCached(el) {
    if (displayCache.has(el)) return displayCache.get(el);
    let d = '';
    try { d = getComputedStyle(el).display; } catch(e) {}
    displayCache.set(el, d);
    return d;
  }

  /* ── رفع باگ کلمات تک‌حرف ──
   * قبلاً isPersianDominant برای متن‌های با طول < 2 مقدار false برمی‌گرداشت.
   * این باعث می‌شد کلمات تک‌حرف فارسی (مثل "و"، "ر"، prepositions) نادیده
   * گرفته شوند. حالا حتی تک‌حرف فارسی هم پردازش می‌شود. */
  function isPersianDominant(text) {
    const t = text.trim();
    if (t.length === 0) return false;
    let p = 0, l = 0;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (PERSIAN_RE.test(c)) p++;
      else if (LATIN_RE.test(c)) l++;
    }
    /* اگر حداقل یک حرف فارسی وجود دارد و فارسی‌ها >= لاتین‌ها */
    return p > 0 && p >= l;
  }

  function findSafeBlockAncestor(el) {
    let cur = el, depth = 0;
    const boundary = el.getRootNode ? el.getRootNode() : document;
    while (cur && cur !== boundary && depth < 12) {
      if (cur.nodeType === 1 && SAFE_BLOCK_DISPLAYS.has(getDisplayCached(cur))) return cur;
      cur = cur.parentElement || (cur.parentNode && cur.parentNode.host) || null;
      depth++;
    }
    return null;
  }

  let customExcludeSelector = '';
  let rejectSelector = '';

  function computeRejectSelector() {
    const parts = [ICON_SELECTOR, EDITABLE_SELECTOR];
    if (customExcludeSelector) parts.push(customExcludeSelector);
    rejectSelector = parts.join(', ');
  }

  function isRejectedElement(el) {
    if (!rejectSelector) return false;
    try { return el.matches(rejectSelector); } catch(e) { return false; }
  }

  function getActiveEditableRoot() {
    const active = document.activeElement;
    if (!active) return null;
    if (EDITABLE_TAGS.has(active.tagName)) return active;
    try {
      const closest = active.closest(EDITABLE_SELECTOR);
      if (closest) return closest;
    } catch(e) {}
    return null;
  }

  const faExtGenerated = new WeakSet();

  function buildRuns(text) {
    const tokens = text.match(TOKEN_RE) || [text];
    const runs = [];
    for (const tok of tokens) {
      const isSpace  = /^\s+$/.test(tok);
      const isPersian = !isSpace && PERSIAN_RE.test(tok);
      if (isSpace && runs.length) {
        runs[runs.length - 1].text += tok;
        continue;
      }
      if (!isSpace && runs.length && runs[runs.length - 1].isPersian === isPersian) {
        runs[runs.length - 1].text += tok;
        continue;
      }
      runs.push({ text: tok, isPersian });
    }
    return runs;
  }

  function segmentTextNode(node, parentEl) {
    const original = node.nodeValue;
    if (!original || !PERSIAN_RE.test(original)) return false;

    let text = convertDigitsSmart(original);
    text = applyTypography(text);

    const runs = buildRuns(text);
    if (runs.length === 0) return false;
    if (runs.length === 1 && !runs[0].isPersian) return false;

    /* تشخیص وزن فونت والد — وزن به ارث برده می‌شود، نیازی به کلاس اضافی نیست */

    const frag = document.createDocumentFragment();
    for (const run of runs) {
      if (run.isPersian) {
        const span = document.createElement('span');
        span.className = FONT_SPAN_CLASS;
        span.dir = 'rtl';
        span.textContent = run.text;
        faExtGenerated.add(span);
        frag.appendChild(span);
      } else {
        const tn = document.createTextNode(run.text);
        faExtGenerated.add(tn);
        frag.appendChild(tn);
      }
    }

    node.replaceWith(frag);
    return true;
  }

  /* ──────────────────────────────────────────────────────────────────────
   * فونت فارسی برای فیلدهای فرم */
  const SKIP_INPUT_TYPES = new Set([
    'password','hidden','file','color','range',
    'checkbox','radio','submit','button','image','reset'
  ]);

  function isFormTextField(el) {
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return !SKIP_INPUT_TYPES.has(type);
    }
    return false;
  }

  function updateFormFieldFont(el) {
    if (!el || el.nodeType !== 1 || !EDITABLE_TAGS.has(el.tagName)) return;

    if (el.tagName === 'INPUT' && !isFormTextField(el)) {
      el.classList.remove(FORM_FONT_CLASS);
      return;
    }
    if (isRejectedElement(el)) {
      el.classList.remove(FORM_FONT_CLASS);
      return;
    }

    let text = '';
    if (el.tagName === 'OPTION') {
      text = el.textContent || '';
    } else if (el.tagName === 'SELECT') {
      const opt = el.selectedOptions && el.selectedOptions[0];
      text = opt ? (opt.textContent || '') : '';
    } else {
      text = el.value || el.getAttribute('placeholder') || '';
    }

    if (text && isPersianDominant(text)) el.classList.add(FORM_FONT_CLASS);
    else el.classList.remove(FORM_FONT_CLASS);
  }

  /* اعمال فونت/راست‌چین روی ریشه‌ی یک contenteditable بدون wrap کردن span
     (تا ساختار ویرایشگر خراب نشود). ویرایشگرهای کد کاملاً نادیده گرفته می‌شوند.
     چون @font-face با unicode-range فقط محدوده‌ی فارسی است، متن انگلیسی داخل
     ویرایشگر همچنان با فونت fallback رندر می‌شود. */
  function updateEditableRoot(el) {
    if (!el || el.nodeType !== 1) return;
    try {
      if (el.matches(CODE_EDITOR_SELECTOR) || el.closest(CODE_EDITOR_SELECTOR)) {
        el.classList.remove(EDIT_FONT_CLASS);
        return;
      }
    } catch (e) {}
    const text = (el.textContent || '').trim();
    if (text && isPersianDominant(text)) el.classList.add(EDIT_FONT_CLASS);
    else el.classList.remove(EDIT_FONT_CLASS);
  }

  function collectEditableRoots(root) {
    if (!root.querySelectorAll) return [];
    return root.querySelectorAll('[contenteditable]:not([contenteditable="false"])');
  }

  function collectFormFields(root) {
    const out = [];
    if (root.nodeType === 1 && EDITABLE_TAGS.has(root.tagName)) out.push(root);
    if (root.querySelectorAll) {
      const list = root.querySelectorAll('input, textarea, select, option');
      for (let i = 0; i < list.length; i++) out.push(list[i]);
    }
    return out;
  }

  function processFormFields(fields) {
    for (const el of fields) updateFormFieldFont(el);
  }

  const alignedElements = new WeakSet();
  function applyAlignToLeaf(el) {
    if (!el || alignedElements.has(el) || isRejectedElement(el)) return;
    alignedElements.add(el);
    el.classList.add(ALIGN_CLASS);
  }

  const processedNodes = new WeakSet();

  const treeWalkerFilter = {
    acceptNode(node) {
      if (node.nodeType === 1) {
        if (NEVER_TOUCH_TAGS.has(node.tagName))    return NodeFilter.FILTER_REJECT;
        if (EDITABLE_TAGS.has(node.tagName))        return NodeFilter.FILTER_REJECT;
        if (faExtGenerated.has(node))               return NodeFilter.FILTER_REJECT;
        if (isRejectedElement(node))                return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
      if (node.nodeType === 3) {
        if (faExtGenerated.has(node))               return NodeFilter.FILTER_REJECT;
        if (processedNodes.has(node))               return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p || NEVER_TOUCH_TAGS.has(p.tagName) || EDITABLE_TAGS.has(p.tagName))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  };

  function collectFromRoot(root) {
    const textNodes  = [];
    const shadowHosts = [];
    let walker;
    try {
      walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, treeWalkerFilter);
    } catch(e) { return { textNodes, shadowHosts, formFields: collectFormFields(root) }; }
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === 3) textNodes.push(node);
      else if (node.nodeType === 1 && node.shadowRoot) shadowHosts.push(node.shadowRoot);
    }
    return { textNodes, shadowHosts, formFields: collectFormFields(root) };
  }

  /* پردازش synchronous و فوری
     رفع باگ «متن ناقص می‌ماند»: قبلاً اگر پردازش یک node خطا می‌داد (مثلاً به
     دلیل تغییر هم‌زمان DOM توسط خودِ سایت روی صفحات SPA)، کل حلقه متوقف
     می‌شد و باقی نودهای فارسی هرگز پردازش نمی‌شدند. حالا هر node جدا
     try/catch می‌شود تا خطای یک مورد مانع پردازش بقیه نشود. */
  function processNodes(nodes) {
    for (const node of nodes) {
      try {
        if (!node.isConnected) continue;
        processedNodes.add(node);
        const val = node.nodeValue;
        /* فونت روی هر متنی که «حتی یک بخش فارسی» دارد اعمال می‌شود،
           فارغ از اینکه انگلیسی غالب باشد یا فارسی. */
        if (!PERSIAN_RE.test(val)) continue;
        const parentBefore = node.parentElement;
        const changed = segmentTextNode(node, parentBefore);
        /* راست‌چین اما فقط روی بلوک‌های «فارسی‌غالب» تا چیدمان انگلیسی به‌هم نریزد. */
        if (changed && parentBefore && eff.rtl && isPersianDominant(val)) {
          const leaf = findSafeBlockAncestor(parentBefore);
          if (leaf) applyAlignToLeaf(leaf);
        }
      } catch (e) { /* یک node خراب نباید مانع پردازش بقیه شود */ }
    }
  }

  function fullScan() {
    if (!masterActive() || !document.body) return;
    computeRejectSelector();

    const queue = [document.body];
    const seen  = new Set();
    while (queue.length) {
      const root = queue.shift();
      if (seen.has(root)) continue;
      seen.add(root);
      /* رفع باگ «متن ناقص می‌ماند»: خطا در یک زیردرخت (مثلاً یک shadow root
         عجیب) نباید مانع اسکن بقیه‌ی صفحه شود. */
      try {
        const { textNodes, shadowHosts, formFields } = collectFromRoot(root);
        processNodes(textNodes);
        processFormFields(formFields);
        const editRoots = collectEditableRoots(root);
        for (let i = 0; i < editRoots.length; i++) updateEditableRoot(editRoots[i]);
        for (const sh of shadowHosts) {
          injectStylesIntoShadow(sh);
          queue.push(sh);
        }
      } catch (e) { /* ادامه بده با بقیه‌ی صف */ }
    }
  }

  function isSelfCaused(mutation) {
    if (mutation.type === 'characterData') return faExtGenerated.has(mutation.target);
    if (mutation.type === 'childList') {
      if (mutation.addedNodes.length === 0) return false;
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        if (!faExtGenerated.has(mutation.addedNodes[i])) return false;
      }
      return true;
    }
    return false;
  }

  let mutationObserver = null;
  const observedRoots  = new WeakSet();

  function observeRoot(root) {
    if (observedRoots.has(root)) return;
    observedRoots.add(root);
    try {
      mutationObserver.observe(root, {
        childList:      true,
        subtree:        true,
        characterData:  true,
        attributes:       true,
        attributeFilter: ['placeholder']
      });
    } catch(e) {}
  }

  function scanSubtreeNow(root) {
    if (!root || !root.isConnected) return;
    if (root.nodeType !== 1 && !(root instanceof ShadowRoot)) return;
    if (root instanceof ShadowRoot) injectStylesIntoShadow(root);

    const { textNodes, shadowHosts, formFields } = collectFromRoot(root);
    processNodes(textNodes);
    processFormFields(formFields);
    for (const sh of shadowHosts) {
      injectStylesIntoShadow(sh);
      observeRoot(sh);
      scanSubtreeNow(sh);
    }
  }

  function startMutationObserver() {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(mutations => {
      if (!masterActive()) return;

      const editingRoot = getActiveEditableRoot();

      for (const m of mutations) {
        /* رفع باگ «متن ناقص می‌ماند»: قبلاً اگر پردازش یک mutation خطا می‌داد
           (مثلاً یک node که هم‌زمان توسط فریم‌ورک سایت حذف شده بود)، بقیه‌ی
           mutation های همان batch اصلاً بررسی نمی‌شدند و محتوای تازه‌ی
           تزریق‌شده در سایت‌های داینامیک/SPA بدون فونت/راست‌چین می‌ماند. */
        try {
          if (isSelfCaused(m)) continue;
          if (editingRoot && (editingRoot === m.target || editingRoot.contains(m.target))) continue;

          if (m.type === 'childList' && m.addedNodes.length) {
            for (let i = 0; i < m.addedNodes.length; i++) {
              const n = m.addedNodes[i];
              try {
                if (editingRoot && (n === editingRoot || (n.nodeType === 1 && n.contains(editingRoot)))) continue;
                if (n.nodeType === 1) {
                  if (n.shadowRoot) observeRoot(n.shadowRoot);
                  scanSubtreeNow(n);
                } else if (n.nodeType === 3) {
                  if (PERSIAN_RE.test(n.nodeValue || '')) {
                    processNodes([n]);
                  }
                }
              } catch (e) { /* ادامه بده با بقیه‌ی addedNodes */ }
            }
          }

          if (m.type === 'characterData') {
            if (PERSIAN_RE.test(m.target.nodeValue || '')) {
              processNodes([m.target]);
            }
          }

          if (m.type === 'attributes' && m.attributeName === 'placeholder') {
            updateFormFieldFont(m.target);
          }
        } catch (e) { /* ادامه بده با بقیه‌ی mutation های همین batch */ }
      }
    });

    observeRoot(document.documentElement);
  }

  /* ──────────────────────────────────────────────────────────────────────
   * رفع باگ اعمال نشدن روی بعضی سایت‌ها (نیاز به رفرش)
   *
   * مشکل: در سایت‌های SPA و سایت‌هایی که محتوا را بعد از load تزریق می‌کنند،
   * اگر content script قبل از آماده شدن DOM اجرا شود و bootstrap زودتر
   * از وجود body فراخوانی شود، ممکن است اسکن انجام نشود.
   *
   * راه‌حل:
   *   ۱. اگر body وجود ندارد، هم DOMContentLoaded و هم readystatechange صبر می‌کنیم
   *   ۲. یک scan تأخیری با setTimeout هم اضافه شده برای سایت‌هایی که دیر لود می‌شوند
   *   ۳. اگر بعد از bootstrap هم تنظیمات تغییر کرد و masterActive شد، rescan می‌کنیم
   *   ۴. visibilitychange برای تب‌هایی که از background برمی‌گردند */
  function bootstrap() {
    /* رفع باگ «سایت لود نمی‌شود / ارور می‌خورد»: اگر افزونه در حین اجرا
       ری‌لود/آپدیت شود، chrome.runtime.getURL خطای
       "Extension context invalidated" می‌دهد. بدون این try/catch این خطا
       اجرای بقیه‌ی bootstrap (و در نتیجه رندر صفحه) را مختل می‌کرد. */
    try {
      injectMainStyles();
    } catch (e) { return; }
    applyHtmlClasses();
    customExcludeSelector = (settings.faExcludeSelectors || []).filter(Boolean).join(',');
    computeRejectSelector();

    if (!masterActive()) return;

    function run() {
      fullScan();
      startMutationObserver();
      /* scan تأخیری برای سایت‌هایی که محتوا را دیر تزریق می‌کنند */
      setTimeout(() => {
        if (masterActive() && document.body) {
          scanSubtreeNow(document.body);
        }
      }, 300);
      /* scan دوم برای سایت‌های خیلی دیر لود */
      setTimeout(() => {
        if (masterActive() && document.body) {
          scanSubtreeNow(document.body);
        }
      }, 1000);
    }

    let bootRan = false;
    function runOnce() {
      if (bootRan) return;
      bootRan = true;
      run();
    }

    if (document.body) {
      runOnce();
    } else {
      document.addEventListener('DOMContentLoaded', runOnce, { once: true });
      /* fallback: اگر DOMContentLoaded هم از دست رفت */
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          if (masterActive() && document.body) {
            runOnce();
          }
        }
      }, { once: true });
    }

    window.addEventListener('load', () => {
      if (masterActive()) scanSubtreeNow(document.body);
    }, { once: true });

    /* رفع باگ برگشت از background — تب‌هایی که قبلاً باز بوده‌اند */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && masterActive() && document.body) {
        scanSubtreeNow(document.body);
      }
    });
  }

  const settingsPromise = new Promise(resolve =>
    chrome.storage.sync.get(Object.keys(DEF), res => {
      settings = { ...DEF, ...res };
      recomputeEff();
      resolve();
    })
  );

  const fontPromise = preloadFonts();

  Promise.all([settingsPromise, fontPromise]).then(bootstrap);

  /* هر تغییری در تنظیمات → بارگیری دوباره‌ی کامل، محاسبه‌ی مجدد eff و اعمال. */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get(Object.keys(DEF), res => {
      settings = { ...DEF, ...res };
      recomputeEff();
      customExcludeSelector = (settings.faExcludeSelectors || []).filter(Boolean).join(',');
      computeRejectSelector();
      injectMainStyles();
      applyHtmlClasses();
      if (masterActive() && document.body) {
        if (!mutationObserver) startMutationObserver();
        scanSubtreeNow(document.body);
      }
    });
  });

  let translatePopup = null;

  function removeTranslatePopup() {
    if (translatePopup) { translatePopup.remove(); translatePopup = null; }
  }

  function showTranslatePopup(text, rect) {
    removeTranslatePopup();
    const el = document.createElement('div');
    el.textContent = 'در حال ترجمه...';
    Object.assign(el.style, {
      position: 'fixed',
      left:     Math.max(8, rect.left) + 'px',
      top:      (rect.bottom + 8) + 'px',
      maxWidth: '340px',
      background: '#14231a',
      color:      '#eaf3ec',
      padding:    '10px 14px',
      borderRadius: '10px',
      fontSize:   '13px',
      lineHeight: '1.45',
      zIndex:     '2147483647',
      direction:  'rtl',
      fontFamily: 'Tahoma, Arial, sans-serif',
      boxShadow:  '0 8px 24px rgba(0,0,0,.35)'
    });
    document.body.appendChild(el);
    translatePopup = el;

    try {
      chrome.runtime.sendMessage({ type: 'faExtTranslate', text }, res => {
        if (!translatePopup) return;
        translatePopup.textContent = (res && res.translated) ? res.translated : 'ترجمه ناموفق بود.';
      });
    } catch (e) {
      if (translatePopup) translatePopup.textContent = 'خطا در ارتباط با افزونه.';
    }

    document.addEventListener('click', function away(ev) {
      if (translatePopup && !translatePopup.contains(ev.target)) {
        removeTranslatePopup();
        document.removeEventListener('click', away);
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────────────
   * ویژگی جدید: دیکشنری هاور
   * با نگه‌داشتن کلید Alt و بردن ماوس روی یک کلمه‌ی انگلیسی، معنی فارسی
   * سریع آن (از یک دیکشنری کوچک و کاملاً آفلاین در dictionary.js) نمایش
   * داده می‌شود. کاملاً محلی است — هیچ درخواست شبکه‌ای ارسال نمی‌شود.
   * به‌عمد به‌جای wrap کردن تک‌تک کلمات صفحه در span (که می‌توانست باعث
   * باگ‌های مشابه بهم‌ریختگی متن شود)، فقط با caretRangeFromPoint موقعیت
   * زیر ماوس خوانده می‌شود؛ یعنی هیچ تغییری در DOM سایت ایجاد نمی‌شود. */
  const WORD_AT_POINT_RE = /[A-Za-z][A-Za-z'-]*/;
  let hoverDictEl = null;
  let hoverDictWord = '';

  function removeHoverDict() {
    if (hoverDictEl) { hoverDictEl.remove(); hoverDictEl = null; hoverDictWord = ''; }
  }

  function showHoverDict(word, meaning, x, y) {
    if (hoverDictWord === word && hoverDictEl) return;
    removeHoverDict();
    hoverDictWord = word;
    const el = document.createElement('div');
    el.textContent = word + ' → ' + meaning;
    Object.assign(el.style, {
      position: 'fixed',
      left: Math.max(8, x + 12) + 'px',
      top: Math.max(8, y + 18) + 'px',
      maxWidth: '280px',
      background: '#14231a',
      color: '#eaf3ec',
      padding: '6px 10px',
      borderRadius: '8px',
      fontSize: '13px',
      lineHeight: '1.5',
      zIndex: '2147483647',
      direction: 'rtl',
      fontFamily: 'Tahoma, Arial, sans-serif',
      boxShadow: '0 6px 18px rgba(0,0,0,.3)',
      pointerEvents: 'none'
    });
    document.body.appendChild(el);
    hoverDictEl = el;
  }

  function getWordAtPoint(x, y) {
    let range = null;
    try {
      if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(x, y);
      else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos && pos.offsetNode) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
        }
      }
    } catch (e) { return null; }
    if (!range || !range.startContainer || range.startContainer.nodeType !== 3) return null;
    const node = range.startContainer;
    const text = node.nodeValue || '';
    const offset = Math.min(range.startOffset, text.length);
    let start = offset, end = offset;
    while (start > 0 && /[A-Za-z'-]/.test(text[start - 1])) start--;
    while (end < text.length && /[A-Za-z'-]/.test(text[end])) end++;
    const word = text.slice(start, end).replace(/^[-']+|[-']+$/g, '');
    if (!word || !WORD_AT_POINT_RE.test(word)) return null;
    return word;
  }

  let hoverDictRaf = null;
  document.addEventListener('mousemove', (e) => {
    if (!settings.faHoverDictEnabled || !e.altKey || typeof FaExtDictionary === 'undefined') {
      if (hoverDictEl) removeHoverDict();
      return;
    }
    if (!masterActive()) return;
    if (hoverDictRaf) cancelAnimationFrame(hoverDictRaf);
    const x = e.clientX, y = e.clientY;
    hoverDictRaf = requestAnimationFrame(() => {
      try {
        const word = getWordAtPoint(x, y);
        if (!word) { removeHoverDict(); return; }
        const meaning = FaExtDictionary.DICT[word.toLowerCase()];
        if (!meaning) { removeHoverDict(); return; }
        showHoverDict(word, meaning, x, y);
      } catch (e) { removeHoverDict(); }
    });
  }, { capture: true, passive: true });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') removeHoverDict();
  });
  window.addEventListener('blur', removeHoverDict);

  /* هنگام تایپ: فیلدهای فرم و ویرایشگرهای contenteditable را زنده به‌روزرسانی کن */
  function handleTypingTarget(t) {
    if (!masterActive() || !t || t.nodeType !== 1) return;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') {
      updateFormFieldFont(t);
      return;
    }
    let editRoot = null;
    try { editRoot = t.closest && t.closest('[contenteditable]:not([contenteditable="false"])'); } catch (e) {}
    if (editRoot) updateEditableRoot(editRoot);
  }

  document.addEventListener('input',   e => handleTypingTarget(e.target), true);
  document.addEventListener('change',  e => handleTypingTarget(e.target), true);
  document.addEventListener('focusin', e => handleTypingTarget(e.target), true);

  document.addEventListener('keydown', e => {
    if (!settings.faTranslateHotkey) return;
    if (e.altKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
      const sel  = window.getSelection();
      const text = sel && sel.toString().trim();
      if (!text) return;
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      showTranslatePopup(text, rect);
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'faExtGetStatus') {
      sendResponse({ active: masterActive(), alignOn: eff.rtl, fontOn: eff.font, rtl: eff.rtl, hasOverride: eff.hasOverride });
      return true;
    }
    return false;
  });

})();
