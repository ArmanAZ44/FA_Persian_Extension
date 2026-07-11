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

  /* تنظیمات پیش‌فرض سراسری — منبع واحد برای همه‌ی فایل‌ها */
  const DEFAULTS = {
    faEnabled:         true,   // کلید اصلی فعال‌بودن افزونه (سراسری)
    faFontEnabled:     true,   // اعمال فونت فارسی به‌صورت پیش‌فرض روی همه سایت‌ها
    faRtlDefault:      false,  // راست‌چین به‌صورت پیش‌فرض روی همه سایت‌ها خاموش
    faFontScale:       115,     // مقیاس پایه‌ی فونت فارسی (۸۵ تا ۱۳۰)
    faDigitConvert:    true,   // تبدیل ارقام لاتین به فارسی داخل متن فارسی
    faTypography:      false,  // اصلاح نیم‌فاصله/نشانه‌گذاری فارسی
    faSpacingEnabled:  true,   // اصلاح محافظه‌کارانه‌ی فاصله‌ی خط و کلمه
    faTranslateHotkey: false,  // میانبر ترجمه‌ی سریع (Alt+Shift+T)
    faHoverDictEnabled: true,  // دیکشنری هاور: نگه‌داشتن Alt + هاور روی کلمه انگلیسی
    faTheme:           'auto', // پوسته‌ی پنل: auto | light | dark
    faExcludeSelectors: [],    // سلکتورهای CSS که هرگز نباید لمس شوند
    /* override اختصاصی هر دامنه:
       { "example.com": { enabled?, font?, rtl?, scale?, digit?, typography?, spacing? } }
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

    return {
      hardExcluded,
      enabled:    !hardExcluded && pick(ov.enabled, pick(rec.enabled, s.faEnabled)),
      font:       pick(ov.font,       pick(rec.font,       s.faFontEnabled)),
      rtl:        pick(ov.rtl,        pick(rec.rtl,        s.faRtlDefault)),
      scale:      pick(ov.scale,      pick(rec.scale,      s.faFontScale)),
      digit:      pick(ov.digit,      pick(rec.digit,      s.faDigitConvert)),
      typography: pick(ov.typography, pick(rec.typography, s.faTypography)),
      spacing:    pick(ov.spacing,    pick(rec.spacing,    s.faSpacingEnabled)),
      hasOverride: !!Object.keys(ov).length,
      isRecommended: !Object.keys(ov).length && !!Object.keys(rec).length
    };
  }

  const FaExtExclusions = {
    EXCLUDED_TLDS,
    EXCLUDED_DOMAINS,
    RECOMMENDED_SITE_DEFAULTS,
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
