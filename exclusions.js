/**
 * فا | هسته‌ی متمرکز: استثناها، تنظیمات پیش‌فرض و منطق تفکیک هر سایت.
 *
 * این فایل تنها منبع حقیقت (single source of truth) برای سه چیز است و در
 * content script، background و صفحات popup/options بارگذاری می‌شود:
 *
 *   1. DEFAULTS         → مقادیر پیش‌فرض تمام تنظیمات
 *   2. isHardExcluded   → دامنه‌هایی که همیشه باید کاملاً بی‌اثر بمانند (.ir)
 *   3. resolveSite      → محاسبه‌ی «تنظیمات مؤثر» برای یک دامنه با درنظرگرفتن
 *                          override اختصاصی همان سایت
 *
 * ─────────────────────────────────────────────────────────────────────────
 * مدل رفتاری نسخه ۱.۱.۰:
 *   • فونت فارسی + اندازه‌ی هوشمند  → به‌صورت پیش‌فرض روی همه‌ی سایت‌ها روشن
 *   • راست‌چین (RTL)                → به‌صورت پیش‌فرض روی همه‌ی سایت‌ها خاموش
 *   • هر دامنه می‌تواند override اختصاصی داشته باشد (از داخل پاپ‌آپ)
 *   • دامنه‌های .ir همیشه کاملاً مستثنا هستند
 * ─────────────────────────────────────────────────────────────────────────
 */

(function (root) {
  'use strict';

  /* پسوندهای دامنه‌ای که باید کاملاً مستثنا شوند (سایت‌های ایرانی از قبل فارسی‌اند) */
  const EXCLUDED_TLDS = ['.ir'];

  /* دامنه‌های ایرانیِ شناخته‌شده که پسوند .ir ندارند اما روی هاست داخلی ایران
     میزبانی می‌شوند و از قبل فونت/راست‌چین فارسی مناسب خودشان را دارند؛
     بنابراین نیازی به اعمال افزونه روی آن‌ها نیست (زیردامنه‌ها هم پوشش داده می‌شوند). */
  const EXCLUDED_DOMAINS_CORE = [
    // شبکه‌های اجتماعی، پیام‌رسان و ویدئو
    'aparat.com', 'eitaa.com', 'gap.im', 'filimo.com', 'namasha.com', 'telewebion.com',
    // فروشگاه و کسب‌وکار
    'digikala.com', 'digistyle.com', 'basalam.com', 'torob.com',
    'sheypoor.com', 'otaghak.com', 'jabama.com', 'flightio.com',
    // ورزش
    'varzesh3.com',
    // خبرگزاری‌های ایرانی با دامنه غیر .ir
    'mehrnews.com', 'tasnimnews.com', 'asriran.com', 'khabarfarsi.com', 'yjc.news',
    // وبلاگ، سرگرمی و فروم
    'namnak.com', 'ninisite.com', 'beytoote.com', 'mihanblog.com', 'blogfa.com',
    'p30download.com'
  ];

  /* نسخه ۱.۳.۰: هزاران دامنه‌ی فارسی‌زبان غیر .ir از excluded-domains-data.js
     (فایل جداگانه، فقط داده) به فهرست اصلی افزوده می‌شود. اگر آن فایل به هر
     دلیلی لود نشده باشد (مثلاً ترتیب اسکریپت در یک محیط دیگر)، افزونه با
     فهرست پایه‌ی EXCLUDED_DOMAINS_CORE به کار خودش ادامه می‌دهد. */
  const EXTRA = (typeof self !== 'undefined' && self.FaExtExtraExcludedDomains)
    ? self.FaExtExtraExcludedDomains
    : (typeof globalThis !== 'undefined' && globalThis.FaExtExtraExcludedDomains) || [];

  const EXCLUDED_DOMAINS = EXCLUDED_DOMAINS_CORE.concat(EXTRA);

  /* نسخه ۱.۳.۲: پیش‌فرض‌های هوشمند مخصوص هر دامنه (Recommended Site Defaults).
     برخلاف override کاربر (faSiteOverrides) که دستی و در storage.sync ذخیره
     می‌شود، این فهرست ثابت و داخل خودِ افزونه است: برای سایت‌هایی که مخاطب
     فارسی‌زبان زیادی دارند اما فونت/زبان انگلیسی دارند (مثل چت زنده‌ی Kick)،
     به‌جای اینکه کاربر مجبور شود دستی از پاپ‌آپ راست‌چین را روشن کند، همان
     اولین بار به‌صورت پیش‌فرض «ترجمه‌شده/راست‌چین» نمایش داده می‌شود.
     اولویت نهایی در resolveSite: override دستی کاربر > این پیش‌فرض‌ها > تنظیم سراسری. */
  const RECOMMENDED_SITE_DEFAULTS = {
    'kick.com': { rtl: true }
  };

  function findRecommended(host) {
    if (!host) return null;
    let cur = host;
    while (cur) {
      if (RECOMMENDED_SITE_DEFAULTS[cur]) return RECOMMENDED_SITE_DEFAULTS[cur];
      const dot = cur.indexOf('.');
      if (dot === -1) break;
      cur = cur.slice(dot + 1);
    }
    return null;
  }

  /* برای تشخیص سریع (O(1)) دامنه‌ی دقیق، و برای زیردامنه‌ها با کندن
     لیبل‌های سمت چپ هاست به‌ترتیب (O(depth) به‌جای O(n) روی کل فهرست —
     این با وجود ده‌ها هزار دامنه در فهرست حیاتی است تا هر بارگذاری صفحه
     را کند نکند). */
  const EXCLUDED_DOMAINS_SET = new Set(EXCLUDED_DOMAINS);

  /* ── فهرست فونت‌های فارسیِ همراه افزونه (نسخه ۲.۰.۰) ─────────────────────
     همه‌ی فونت‌ها به‌صورت آفلاین همراه بسته عرضه می‌شوند (بدون هیچ درخواست
     اینترنتی) و همه تحت مجوز OFL هستند. هر فونت یک نام CSS یکتا با پیشوند
     «FaExtFont» دارد تا هرگز با فونت‌های خود سایت تداخل نکند.
     files: آرایه‌ی [وزن, نام فایل] — فونت‌های متغیر یک ردیف با بازه‌ی وزن. */
  const FONTS = [
    { id: 'vazirmatn', name: 'وزیرمتن', css: 'FaExtFontVazirmatn',
      note: 'پیش‌فرض — خوانا و مدرن',
      files: [['400', 'Vazirmatn-Regular.woff2'], ['500', 'Vazirmatn-Medium.woff2'], ['700', 'Vazirmatn-Bold.woff2']] },

    { id: 'sahel', name: 'ساحل', css: 'FaExtFontSahel',
      note: 'نرم و دلنشین برای متن‌های طولانی',
      files: [['400', 'Sahel-Regular.woff2'], ['500', 'Sahel-Medium.woff2'], ['700', 'Sahel-Bold.woff2']] },

    { id: 'samim', name: 'صمیم', css: 'FaExtFontSamim',
      note: 'تمیز و متعادل برای رابط کاربری',
      files: [['400', 'Samim-Regular.woff2'], ['500', 'Samim-Medium.woff2'], ['700', 'Samim-Bold.woff2']] },

    { id: 'shabnam', name: 'شبنم', css: 'FaExtFontShabnam',
      note: 'کلاسیک و بسیار خوانا',
      files: [['400', 'Shabnam-Regular.woff2'], ['500', 'Shabnam-Medium.woff2'], ['700', 'Shabnam-Bold.woff2']] },

    { id: 'estedad', name: 'استعداد', css: 'FaExtFontEstedad',
      note: 'مدرن با وزن‌های متنوع',
      files: [['400', 'Estedad-Regular.woff2'], ['500', 'Estedad-Medium.woff2'], ['700', 'Estedad-Bold.woff2']] },

    { id: 'noto', name: 'نوتو سنس عربی', css: 'FaExtFontNoto',
      note: 'خنثی، رسمی و همه‌منظوره',
      files: [['100 900', 'NotoSansArabic-Regular.woff2']] },

    { id: 'plex', name: 'آی‌بی‌ام پلکس', css: 'FaExtFontPlex',
      note: 'دقیق و شرکتی',
      files: [['400', 'IBMPlexSansArabic-Regular.woff2'], ['500', 'IBMPlexSansArabic-Medium.woff2'], ['700', 'IBMPlexSansArabic-Bold.woff2']] },

    { id: 'cairo', name: 'قاهره', css: 'FaExtFontCairo',
      note: 'هندسی و امروزی',
      files: [['100 900', 'Cairo-Regular.woff2']] }
  ];

  const FONT_IDS = FONTS.map(f => f.id);
  const DEFAULT_FONT_ID = 'vazirmatn';

  /* ── پروفایل‌های آماده (نسخه ۲.۰.۰) ──────────────────────────────────────
     هر پروفایل چند تنظیم مرتبط را با هم عوض می‌کند تا کاربر با یک کلیک به
     ظاهر دلخواهش برسد. */
  const PRESETS = [
    { id: 'readable', name: 'خوانا', desc: 'خط بازتر برای مطالعه‌ی طولانی',
      values: { scale: 100, lineHeight: 170, letterSpacing: 0, spacing: true,  fontWeight: 'auto' } },
    { id: 'compact',  name: 'فشرده', desc: 'جای بیشتر روی صفحه',
      values: { scale: 90,  lineHeight: 120, letterSpacing: 0, spacing: false, fontWeight: 'auto' } },
    { id: 'large',    name: 'درشت',  desc: 'فونت بزرگ‌تر و ضخیم‌تر',
      values: { scale: 115, lineHeight: 0,   letterSpacing: 0, spacing: true,  fontWeight: 'bold' } },
    { id: 'elegant',  name: 'شیک',   desc: 'فاصله‌ی خط و حروف متعادل',
      values: { scale: 100, lineHeight: 155, letterSpacing: 1, spacing: true,  fontWeight: 'normal' } }
  ];

  function getFont(id) {
    for (let i = 0; i < FONTS.length; i++) if (FONTS[i].id === id) return FONTS[i];
    for (let i = 0; i < FONTS.length; i++) if (FONTS[i].id === DEFAULT_FONT_ID) return FONTS[i];
    return FONTS[0];
  }

  /* تنظیمات پیش‌فرض سراسری — منبع واحد برای همه‌ی فایل‌ها */
  const DEFAULTS = {
    faEnabled:         true,   // کلید اصلی فعال‌بودن افزونه (سراسری)
    faFontEnabled:     true,   // اعمال فونت فارسی به‌صورت پیش‌فرض روی همه سایت‌ها
    faRtlDefault:      false,  // راست‌چین به‌صورت پیش‌فرض روی همه سایت‌ها خاموش
    faFontScale:       100,    // مقیاس پایه‌ی فونت فارسی (۷۵ تا ۱۱۵) — مبنا از نسخه ۲.۰.۰ به ۱۰۰ منتقل شد؛ ۱۰۰ = همان اندازه‌ی قبلی (۱۱۵٪ نسخه ۱.x)
    faFontFamily:      DEFAULT_FONT_ID, // شناسه‌ی فونت انتخاب‌شده (نگاه کنید به FONTS)
    faFontWeight:      'auto', // auto | light | normal | bold — ضخامت فونت فارسی
    faLineHeight:      0,      // ۰ = خاموش؛ در غیر این صورت ×۱۰۰ (مثلاً ۱۶۰ = ۱٫۶)
    faLetterSpacing:   0,      // ۰ = خاموش؛ در غیر این صورت ×۰٫۰۱em (مثلاً ۳ = ۰٫۰۳em)
    faNormalizeYK:     false,  // تبدیل «ي/ك» عربی به «ی/ک» فارسی
    faWhitelistMode:   false,  // حالت لیست سفید: فقط سایت‌هایی که دستی فعال شده‌اند
    faAutoBackup:      true,   // پشتیبان‌گیری خودکار از تنظیمات در حافظه‌ی محلی
    faDigitConvert:    true,   // تبدیل ارقام لاتین به فارسی داخل متن فارسی
    faTypography:      false,  // اصلاح نیم‌فاصله/نشانه‌گذاری فارسی
    faSpacingEnabled:  true,   // اصلاح محافظه‌کارانه‌ی فاصله‌ی خط و کلمه
    faTranslateHotkey: false,  // میانبر ترجمه‌ی سریع (Alt+Shift+T)
    faHoverDictEnabled: true,  // دیکشنری هاور: نگه‌داشتن Alt + هاور روی کلمه انگلیسی
    faTheme:           'auto', // پوسته‌ی پنل: auto | light | dark
    faExcludeSelectors: [],    // سلکتورهای CSS که هرگز نباید لمس شوند
    /* override اختصاصی هر دامنه:
       { "example.com": { enabled?, font?, rtl?, scale?, digit?, typography?,
                          spacing?, fontFamily?, fontWeight?, lineHeight?,
                          letterSpacing?, normalizeYK? } }
       هر کلیدی که undefined باشد از تنظیمات سراسری ارث می‌برد. */
    faSiteOverrides:   {}
  };

  function hostMatchesDomain(host, domain) {
    if (!host || !domain) return false;
    return host === domain || host.endsWith('.' + domain);
  }

  function hostHasExcludedTld(host) {
    return EXCLUDED_TLDS.some(tld => host === tld.slice(1) || host.endsWith(tld));
  }

  /* آیا هاست، خودِ یکی از EXCLUDED_DOMAINS یا زیردامنه‌ی آن است؟
     به‌جای پیمایش کل فهرست (که با ده‌ها هزار دامنه کند می‌شد)، هاست را از
     چپ به‌راست لیبل‌به‌لیبل می‌کَنیم و هر سطح را در Set جست‌وجو می‌کنیم:
     مثلاً برای "a.b.example.com" چهار جست‌وجوی O(1) انجام می‌شود:
     a.b.example.com → b.example.com → example.com → com */
  function hostInExcludedDomains(host) {
    if (!host) return false;
    let cur = host;
    while (cur) {
      if (EXCLUDED_DOMAINS_SET.has(cur)) return true;
      const dot = cur.indexOf('.');
      if (dot === -1) break;
      cur = cur.slice(dot + 1);
    }
    return false;
  }

  /* آیا این هاست همیشه باید مستثنا باشد؟
     دامنه‌های .ir و دامنه‌های ایرانیِ شناخته‌شده‌ی داخل EXCLUDED_DOMAINS مستثنای سخت هستند. */
  function isHardExcluded(host) {
    if (!host) return false;
    host = String(host).toLowerCase();
    return hostHasExcludedTld(host) || hostInExcludedDomains(host);
  }

  /* یافتن override منطبق با هاست (تطبیق دقیق یا زیردامنه) */
  function findOverride(overrides, host) {
    if (!overrides || typeof overrides !== 'object' || !host) return null;
    if (overrides[host]) return overrides[host];
    // زیردامنه: اگر برای دامنه‌ی والد override ثبت شده باشد
    const keys = Object.keys(overrides);
    for (const k of keys) {
      if (hostMatchesDomain(host, k)) return overrides[k];
    }
    return null;
  }

  /* تعیین یک مقدار boolean با درنظرگرفتن override (undefined → پیش‌فرض) */
  function pick(ovVal, defVal) {
    return (ovVal === undefined || ovVal === null) ? defVal : ovVal;
  }

  /**
   * محاسبه‌ی «تنظیمات مؤثر» برای یک هاست.
   * خروجی: { enabled, font, rtl, scale, digit, typography, spacing, hardExcluded }
   */
  function resolveSite(settings, host) {
    const s = Object.assign({}, DEFAULTS, settings || {});
    const hostLc = host ? String(host).toLowerCase() : '';
    const hardExcluded = isHardExcluded(hostLc);
    const ov = findOverride(s.faSiteOverrides, hostLc) || {};
    const rec = findRecommended(hostLc) || {};

    let enabled = !hardExcluded && pick(ov.enabled, pick(rec.enabled, s.faEnabled));
    /* حالت لیست سفید: افزونه فقط روی سایت‌هایی کار می‌کند که کاربر دستی
       برایشان enabled:true ثبت کرده باشد. */
    if (!hardExcluded && s.faWhitelistMode && ov.enabled !== true) enabled = false;

    return {
      hardExcluded,
      enabled,
      font:          pick(ov.font,          pick(rec.font,          s.faFontEnabled)),
      rtl:           pick(ov.rtl,           pick(rec.rtl,           s.faRtlDefault)),
      scale:         pick(ov.scale,         pick(rec.scale,         s.faFontScale)),
      fontFamily:    pick(ov.fontFamily,    pick(rec.fontFamily,    s.faFontFamily)),
      fontWeight:    pick(ov.fontWeight,    pick(rec.fontWeight,    s.faFontWeight)),
      lineHeight:    pick(ov.lineHeight,    pick(rec.lineHeight,    s.faLineHeight)),
      letterSpacing: pick(ov.letterSpacing, pick(rec.letterSpacing, s.faLetterSpacing)),
      normalizeYK:   pick(ov.normalizeYK,   pick(rec.normalizeYK,   s.faNormalizeYK)),
      digit:         pick(ov.digit,         pick(rec.digit,         s.faDigitConvert)),
      typography:    pick(ov.typography,    pick(rec.typography,    s.faTypography)),
      spacing:       pick(ov.spacing,       pick(rec.spacing,       s.faSpacingEnabled)),
      whitelistMode: !!s.faWhitelistMode,
      hasOverride: !!Object.keys(ov).length,
      isRecommended: !Object.keys(ov).length && !!Object.keys(rec).length
    };
  }

  const FaExtExclusions = {
    EXCLUDED_TLDS,
    EXCLUDED_DOMAINS,
    RECOMMENDED_SITE_DEFAULTS,
    FONTS,
    FONT_IDS,
    DEFAULT_FONT_ID,
    PRESETS,
    getFont,
    DEFAULTS,
    isHardExcluded,
    hostMatchesDomain,
    findOverride,
    findRecommended,
    resolveSite
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaExtExclusions;
  } else {
    root.FaExtExclusions = FaExtExclusions;
  }
})(typeof self !== 'undefined' ? self : this);
