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

  /* آیا این هاست همیشه باید مستثنا باشد؟ فقط دامنه‌های .ir مستثنای سخت هستند. */
  function isHardExcluded(host) {
    if (!host) return false;
    host = String(host).toLowerCase();
    return hostHasExcludedTld(host);
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

    return {
      hardExcluded,
      enabled:    !hardExcluded && pick(ov.enabled, s.faEnabled),
      font:       pick(ov.font,       s.faFontEnabled),
      rtl:        pick(ov.rtl,        s.faRtlDefault),
      scale:      pick(ov.scale,      s.faFontScale),
      digit:      pick(ov.digit,      s.faDigitConvert),
      typography: pick(ov.typography, s.faTypography),
      spacing:    pick(ov.spacing,    s.faSpacingEnabled),
      hasOverride: !!Object.keys(ov).length
    };
  }

  const FaExtExclusions = {
    EXCLUDED_TLDS,
    DEFAULTS,
    isHardExcluded,
    hostMatchesDomain,
    findOverride,
    resolveSite
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaExtExclusions;
  } else {
    root.FaExtExclusions = FaExtExclusions;
  }
})(typeof self !== 'undefined' ? self : this);
