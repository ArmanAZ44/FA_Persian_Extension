/**
 * فا | راست‌چین‌ساز و فونت فارسی
 * نسخه ۱.۳.۲
 *
 * تغییرات نسخه ۱.۳.۲:
 *   - راست‌چین/فونت فارسی روی Kick.com اکنون به‌صورت پیش‌فرض (بدون نیاز
 *     به تنظیم دستی از پاپ‌آپ) فعال است؛ منبع این پیش‌فرض
 *     RECOMMENDED_SITE_DEFAULTS در exclusions.js است.
 *   - حالت سازگاری Kick بازطراحی شد تا تقریباً بدون تأخیر (live) کار کند:
 *     به‌جای صبر برای رویداد سنگین window 'load'، فقط منتظر پایان parse
 *     شدن HTML (DOMContentLoaded) + دو requestAnimationFrame می‌ماند؛
 *     debounce آبزرور چت زنده هم از ۴۰۰ به ۶۰ میلی‌ثانیه کاهش یافت.
 *
 * تغییرات نسخه ۱.۳.۰:
 *   - حالت سازگاری مخصوص و کاملاً غیرتهاجمی برای ChatGPT
 *     (chatgpt.com / chat.openai.com): فقط CSS + attribute روی کانتینر
 *     هر پیام، بدون segmentTextNode، بدون دستکاری innerHTML، با تشخیص
 *     پایان استریم از طریق سکوت مکث‌دار (debounce).
 *   - رندر تدریجی (Incremental) روی ChatGPT: فونت فارسی دیگر منتظر پایان
 *     کامل پاسخ نمی‌ماند؛ به‌محض این‌که یک بخش (پاراگراف/آیتم لیست) از
 *     استریم برای مدت کوتاهی بدون تغییر بماند، همان بخش (نه کل پیام)
 *     فونت می‌گیرد. کد، فرمول، جدول و فیلدهای ورودی همچنان کاملاً
 *     نادیده گرفته می‌شوند. هیچ بخشی دوباره پردازش یا rescan نمی‌شود.
 *   - رفع باگ لود Kick.com (نیاز به چند بار رفرش): افزودن یک «حالت
 *     سازگاری» مخصوص kick.com که هیچ DOM/CSS ای را قبل از لود کامل صفحه
 *     دست‌کاری نمی‌کند، در طول hydration اولیه‌ی React هیچ
 *     MutationObserver ای فعال نیست، فقط عناصر واقعاً مرئی/رندرشده
 *     پردازش می‌شوند، اسکلتون/placeholder ها هرگز لمس نمی‌شوند، و بعد از
 *     لود اولیه یک observer سبک و debounce‌شده (بدون characterData) جایگزین
 *     می‌شود که به ناوبری داخلی (pushState/replaceState) هم بدون نیاز به
 *     رفرش واکنش نشان می‌دهد.
 *   - افزوده‌شدن هزاران دامنه‌ی فارسی‌زبان جدید به فهرست سایت‌های مستثنا
 *     (exclusions.js + excluded-domains-data.js).
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

  /* ──────────────────────────────────────────────────────────────────────
   * حالت سازگاری مخصوص ChatGPT (نسخه ۱.۳.۰)
   *
   * ChatGPT محتوا را به‌صورت استریم (تدریجی) با React رندر می‌کند. موتور
   * عادی این افزونه متن‌ها را به text-node های جدا تجزیه می‌کند (segmentTextNode)
   * که روی یک صفحه‌ی در حال استریم باعث از دست رفتن کلمات، تکرار متن یا
   * قطع‌شدن پاسخ می‌شود. برای همین، روی chatgpt.com / chat.openai.com
   * اسکریپت اصلاً از segmentTextNode/MutationObserver عمومی استفاده نمی‌کند؛
   * در عوض فقط:
   *   ۱. یک attribute (نه innerHTML/textContent) روی کانتینر هر پیام
   *      می‌گذارد و تمام جهت/فونت از طریق CSS اعمال می‌شود.
   *   ۲. هر پیام فقط یک‌بار پردازش می‌شود (data-fa-ext-gpt-done).
   *   ۳. پردازش هر پیام تا وقتی که مدتی (GPT_QUIET_MS) هیچ تغییری در
   *      متن آن رخ ندهد به تأخیر می‌افتد، تا وسط استریم‌شدن دست‌کاری نشود. */
  const CHATGPT_HOSTS = ['chatgpt.com', 'chat.openai.com'];
  function isChatGptHost(h) {
    if (!h) return false;
    h = String(h).toLowerCase();
    return CHATGPT_HOSTS.some(d => h === d || h.endsWith('.' + d));
  }

  /* ──────────────────────────────────────────────────────────────────────
   * حالت سازگاری مخصوص Kick.com (نسخه ۱.۳.۰)
   *
   * مشکل: Kick یک اپلیکیشن React با hydration سنگین است. مسیر عمومی
   * افزونه (fullScan + MutationObserver با subtree:true روی کل body، از
   * document_start) روی چنین صفحه‌ای می‌تواند صدها/هزاران mutation را در
   * همان چند صد میلی‌ثانیه‌ی اول (که React درحال hydrate/render اولیه است)
   * پردازش کند. این حجم پردازش هم‌زمان با hydration باعث می‌شد لود کیک
   * گاهی گیر کند یا نیاز به چند بار رفرش داشته باشد.
   *
   * راه‌حل: یک مسیر کاملاً جدا برای kick.com که:
   *   ۱. برخلاف مسیر ChatGPT (که منتظر «سکوت کامل» پیام می‌ماند)، اینجا
   *      هدف تأخیر صفر تا حد امکان است: به‌محض پایان parse شدن HTML
   *      (نه رویداد سنگین window 'load') و گذشت دو فریم رندر، همان
   *      اسکن اول اجرا می‌شود؛ راست‌چین/فونت فارسی روی Kick تقریباً
   *      بلافاصله و بدون هیچ تنظیم دستی از طرف کاربر ظاهر می‌شود.
   *   ۲. در طول همان چند فریم اول (پیش از اولین اسکن)، هیچ MutationObserver
   *      ای فعال نیست تا با hydration اولیه‌ی React رقابت نکند.
   *   ۳. کل document در startup اسکن نمی‌شود؛ فقط عناصر «واقعاً قابل‌مشاهده»
   *      (offsetParent/rect غیرصفر) و کاملاً رندرشده پردازش می‌شوند.
   *   ۴. بعد از اسکن اول، MutationObserver با یک debounce بسیار کوتاه
   *      (۶۰ میلی‌ثانیه؛ برخلاف نسخه‌ی قبل که ۴۰۰ میلی‌ثانیه بود) فعال
   *      می‌شود تا هم چت زنده تقریباً هم‌زمان راست‌چین شود و هم CPU با
   *      رندر React رقابت نکند.
   *   ۵. اسکلتون/لودینگ (placeholder) و عناصر موقت هرگز لمس نمی‌شوند.
   *   ۶. در ناوبری بین صفحات (client-side routing)، صفحه نیازی به رفرش
   *      دستی ندارد چون observer با debounce به تغییرات مسیر هم واکنش
   *      نشان می‌دهد، اما همچنان فقط عناصر مرئی و آماده را پردازش می‌کند. */
  const KICK_HOSTS = ['kick.com'];
  function isKickHost(h) {
    if (!h) return false;
    h = String(h).toLowerCase();
    return KICK_HOSTS.some(d => h === d || h.endsWith('.' + d));
  }

  /* سلکتورهای اسکلتون/لودینگ رایج که هرگز نباید پردازش شوند (چه در Kick،
     چه به‌طور کلی برای جلوگیری از فلیکر روی محتوای موقت). */
  const SKELETON_SELECTOR =
    '[class*="skeleton" i], [class*="placeholder" i], [class*="shimmer" i], ' +
    '[aria-busy="true"], [data-loading="true"]';

  function isSkeletonOrHidden(el) {
    if (!el || el.nodeType !== 1) return true;
    try {
      if (el.matches && el.matches(SKELETON_SELECTOR)) return true;
      if (el.closest && el.closest(SKELETON_SELECTOR)) return true;
    } catch (e) {}
    /* فقط عناصر واقعاً رندرشده و مرئی (نه display:none، نه ابعاد صفر). */
    if (!el.isConnected) return true;
    if (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
      /* offsetParent فقط برای عناصر position:fixed/sticky گمراه‌کننده است؛
         برای احتیاط یک بررسی ابعاد هم انجام می‌شود. */
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return true;
      } catch (e) { return true; }
    }
    return false;
  }

  const KICK_DEBOUNCE_MS = 60;
  let kickObserver = null;
  let kickDebounceTimer = null;
  let kickPendingRoots = [];
  let kickInitialLoadDone = false;

  /* اسکن محافظه‌کارانه: فقط زیردرخت داده‌شده، فقط عناصر مرئی/آماده،
     و با همان منطق مشترک fullScan (processNodes/processFormFields) که
     هرگز innerHTML/textContent را جایگزین نمی‌کند. */
  function kickScanRoot(root) {
    if (!root || !root.isConnected) return;
    if (isSkeletonOrHidden(root)) return;
    try {
      const { textNodes, shadowHosts, formFields } = collectFromRoot(root);
      const visibleTextNodes = textNodes.filter(n => {
        const p = n.parentElement;
        return p && !isSkeletonOrHidden(p);
      });
      processNodes(visibleTextNodes);
      processFormFields(formFields.filter(f => !isSkeletonOrHidden(f)));
      for (const sh of shadowHosts) {
        injectStylesIntoShadow(sh);
        kickScanRoot(sh);
      }
    } catch (e) { /* یک خطا در یک زیردرخت نباید مانع بقیه شود */ }
  }

  function flushKickPendingRoots() {
    kickDebounceTimer = null;
    const roots = kickPendingRoots;
    kickPendingRoots = [];
    for (const root of roots) kickScanRoot(root);
  }

  /* debounce واقعی: به‌جای پردازش فوری هر mutation (که روی یک صفحه‌ی
     پرتحرک مثل Kick با چت زنده و پلیر ویدیو می‌تواند صدها بار در ثانیه
     رخ دهد)، ریشه‌های تغییریافته جمع‌آوری و فقط یک‌بار بعد از سکوت کوتاه
     پردازش می‌شوند. این هم CPU را پایین نگه می‌دارد و هم از رقابت با
     رندر/hydration فعال React جلوگیری می‌کند. */
  function scheduleKickScan(root) {
    kickPendingRoots.push(root);
    if (kickDebounceTimer) clearTimeout(kickDebounceTimer);
    kickDebounceTimer = setTimeout(flushKickPendingRoots, KICK_DEBOUNCE_MS);
  }

  function startKickObserver() {
    if (kickObserver || !document.body) return;
    kickObserver = new MutationObserver(mutations => {
      if (!masterActive()) return;
      /* در طول لود اولیه، حتی اگر observer به هر دلیلی زودتر متصل شده
         باشد، هیچ پردازشی انجام نمی‌شود — همه‌چیز تا آماده‌شدن کامل صفحه
         صبر می‌کند. */
      if (!kickInitialLoadDone) return;
      for (const m of mutations) {
        try {
          if (m.type === 'childList' && m.addedNodes.length) {
            for (let i = 0; i < m.addedNodes.length; i++) {
              const n = m.addedNodes[i];
              /* اگر این نود توسط خودِ افزونه تولید شده (مثلاً همان
                 span.fa-ext-fa که segmentTextNode ساخته)، نیازی به
                 اسکن دوباره‌اش نیست — این دقیقاً همان مسیری بود که باعث
                 حلقه‌ی بی‌نهایتِ باگ «زوم مداوم» می‌شد. */
              if (faExtGenerated.has(n)) continue;
              if (n.nodeType === 1 && !isSkeletonOrHidden(n)) scheduleKickScan(n);
            }
          }
        } catch (e) {}
      }
    });
    try {
      /* کاهش فعالیت MutationObserver: بدون characterData، فقط childList —
         تغییرات متنی جزئی (مثلاً شمارنده‌ی بیننده‌ها) اهمیتی برای فونت
         فارسی ندارند و نیازی به رصد نیست. */
      kickObserver.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* شروع حالت سازگاری Kick: تا وقتی صفحه کاملاً لود نشده (readyState
     'complete' + رویداد window 'load')، هیچ کاری انجام نمی‌شود. سپس یک
     مکث امن اضافه (تا hydration اولیه‌ی React هم تمام شود) قبل از اولین
     اسکن سبک اعمال می‌شود. */
  /* شروع حالت سازگاری Kick: به‌جای صبرکردن برای رویداد سنگین window
     'load' (که منتظر تمام تصاویر/منابع صفحه هم می‌ماند و باعث تأخیر
     محسوس در راست‌چین‌شدن می‌شد)، از نسخه ۱.۳.۲ به بعد فقط منتظر
     پایان parse شدن HTML (`DOMContentLoaded` / readyState غیر از
     'loading') می‌مانیم؛ سپس با دو `requestAnimationFrame` متوالی (که
     تضمین می‌کند حداقل یک چرخه‌ی رندر React سپری شده) اولین اسکن سبک
     اجرا می‌شود. این یعنی راست‌چین/فونت فارسی روی Kick تقریباً بلافاصله
     و بدون نیاز به تنظیم دستی ظاهر می‌شود، درحالی‌که همچنان قبل از
     رندر واقعی هیچ DOM ای دست‌کاری نمی‌شود. */
  const KICK_POST_LOAD_SAFETY_MS = 50;

  function startKickCompatMode() {
    function afterFullyLoaded() {
      if (kickInitialLoadDone) return;
      const run = () => {
        if (!masterActive()) return;
        kickInitialLoadDone = true;
        try { injectMainStyles(); } catch (e) {}
        applyHtmlClasses();
        if (document.body) kickScanRoot(document.body);
        startKickObserver();
      };
      /* دو requestAnimationFrame پشت‌سرهم ≈ یک یا دو فریم رندر (سریع‌تر و
         دقیق‌تر از یک مکث ثابت طولانی)، به‌علاوه یک مکث بسیار کوتاه
         احتیاطی برای پوشش موتورهایی که rAF را در تب‌های غیرفعال به تعویق
         می‌اندازند. */
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(run, KICK_POST_LOAD_SAFETY_MS)));
    }

    if (document.readyState !== 'loading') {
      afterFullyLoaded();
    } else {
      document.addEventListener('DOMContentLoaded', afterFullyLoaded, { once: true });
    }

    /* ناوبری داخلی (client-side routing) بدون رفرش: Kick از History API
       برای تغییر صفحه استفاده می‌کند. با گوش‌دادن به این رویدادها، بدون
       نیاز به رصد سنگین DOM، بعد از هر ناوبری یک اسکن سبکِ debounce‌شده
       زمان‌بندی می‌شود — نه یک rescan کامل فوری. */
    let lastKickUrl = location.href;
    function onKickNavigate() {
      if (location.href === lastKickUrl) return;
      lastKickUrl = location.href;
      if (!kickInitialLoadDone || !masterActive()) return;
      /* مکث کوتاه تا محتوای مسیر جدید رندر شود، سپس فقط body (نه کل
         document) با همان مسیر debounce شده اسکن می‌شود. */
      scheduleKickScan(document.body);
    }
    window.addEventListener('popstate', onKickNavigate);
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;
    try {
      history.pushState = function (...args) {
        const r = origPushState.apply(this, args);
        onKickNavigate();
        return r;
      };
      history.replaceState = function (...args) {
        const r = origReplaceState.apply(this, args);
        onKickNavigate();
        return r;
      };
    } catch (e) {}

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && kickInitialLoadDone && masterActive()) {
        scheduleKickScan(document.body);
      }
    });
  }

  const CHATGPT_STYLE_ID  = 'fa-ext-chatgpt-styles';
  const CHATGPT_RTL_ATTR  = 'data-fa-ext-gpt-rtl';
  const CHATGPT_FONT_ATTR = 'data-fa-ext-gpt-font';
  const CHATGPT_DONE_ATTR = 'data-fa-ext-gpt-done';

  const CHATGPT_MESSAGE_SELECTOR = '[data-message-author-role]';

  const CHATGPT_NEVER_RTL_SELECTOR =
    'pre, pre *, code, code *, kbd, samp, var, ' +
    '.katex, .katex *, .katex-display, .katex-display *, math, math *, ' +
    'table, table *, ' +
    'textarea, input, [contenteditable], [contenteditable] *, [role="textbox"], #prompt-textarea, #prompt-textarea *';

  /* ──────────────────────────────────────────────────────────────────────
   * رندر تدریجی (Incremental) روی ChatGPT — نسخه ۱.۳.۰
   *
   * قبلاً فونت فارسی فقط بعد از پایان کامل استریم (finalize پس از سکوت
   * GPT_QUIET_MS) روی کل پیام اعمال می‌شد؛ یعنی کاربر یک متن انگلیسی‌فونت
   * می‌دید که ناگهان در انتها به فونت فارسی می‌پرید. حالا به‌جای آن:
   *
   *   ۱. هر <p>/<li>/... داخل یک پیام (که هنوز در حال استریم است) به‌محض
   *      اینکه یک «مکث کوتاه» (GPT_INCREMENTAL_QUIET_MS) در تغییرش رخ داد،
   *      همان بخش (نه کل پیام) به‌صورت جداگانه بررسی و attribute می‌گیرد.
   *   ۲. هر بخش فقط یک‌بار قطعی (finalize) می‌شود (data-fa-ext-gpt-seg-done) —
   *      هرگز بخش‌های قبلاً قطعی‌شده دوباره لمس نمی‌شوند.
   *   ۳. کل پیام هرگز یک‌جا rescan نمی‌شود؛ فقط زیرمجموعه‌ی تغییریافته.
   *   ۴. در پایان استریم (finalize کلی پیام)، فقط بخش‌های باقی‌مانده‌ی
   *      قطعی‌نشده (مثلاً چند کلمه‌ی آخر) پردازش می‌شوند، نه کل پیام.
   *   ۵. تمام کار از طریق attribute (CSS class injection) است — هیچ
   *      innerHTML/textContent جایگزین نمی‌شود و رندر React دست‌نخورده
   *      می‌ماند. */
  const CHATGPT_SEG_DONE_ATTR = 'data-fa-ext-gpt-seg-done';
  const CHATGPT_SEG_SELECTOR =
    'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dt, dd';

  const GPT_INCREMENTAL_QUIET_MS = 250;

  const gptSegTimers    = new WeakMap();
  const gptSegSeenText  = new WeakMap();

  function isChatGptSegDone(el) {
    return el.getAttribute(CHATGPT_SEG_DONE_ATTR) === '1';
  }

  /* پردازش یک بخش کوچک از پیام با همان attribute-only strategy.
     هرگز innerHTML/textContent را جایگزین نمی‌کند — فقط attribute می‌گذارد. */
  function applyChatGptSegmentDirectives(el) {
    if (!masterActive()) return;
    let text = '';
    try { text = el.textContent || ''; } catch (e) { return; }
    if (!text.trim()) return;
    const persian = isPersianDominant(text);
    if (eff.rtl && persian) el.setAttribute(CHATGPT_RTL_ATTR, '1');
    else el.removeAttribute(CHATGPT_RTL_ATTR);
    if (eff.font && persian) el.setAttribute(CHATGPT_FONT_ATTR, '1');
    else el.removeAttribute(CHATGPT_FONT_ATTR);
  }

  /* آیا این عنصر جزو مناطق ممنوعه (کد، فرمول، جدول، فرم) است که هرگز
     نباید مستقلاً segment یا فونت‌دار شود؟ */
  function isNeverSegmentTarget(el) {
    try { return el.matches(CHATGPT_NEVER_RTL_SELECTOR); } catch (e) { return false; }
  }

  /* قطعی‌سازی یک segment فقط وقتی مکث کوتاهی (GPT_INCREMENTAL_QUIET_MS) در
     تغییر متنش رخ داده باشد؛ یعنی دیگر در وسط استریم نیست. اگر متن هنوز
     در حال تغییر است (React در همان لحظه کلمه‌ی جدید اضافه کرد)، فقط
     همین segment دوباره زمان‌بندی می‌شود — نه کل پیام. */
  function scheduleChatGptSegment(el) {
    if (!el || el.nodeType !== 1 || isChatGptSegDone(el)) return;
    if (isNeverSegmentTarget(el)) return;

    const prevTimer = gptSegTimers.get(el);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      gptSegTimers.delete(el);
      if (!el.isConnected || isChatGptSegDone(el)) return;
      let text = '';
      try { text = el.textContent || ''; } catch (e) { return; }
      const lastSeen = gptSegSeenText.get(el);
      gptSegSeenText.set(el, text);
      if (lastSeen === text) {
        /* بدون تغییر در طول مکث → این بخش دیگر در حال استریم نیست.
           فونت را اعمال کن اما بخش را «قطعی» علامت نزن، چون ممکن است
           استریم بعداً به همین گره برگردد (مثلاً پاراگراف جدید داخل
           همان <li> اضافه شود). قطعی‌شدن نهایی با finalizeChatGptMessage
           پس از پایان کل پیام انجام می‌شود. */
        applyChatGptSegmentDirectives(el);
      } else {
        scheduleChatGptSegment(el);
      }
    }, GPT_INCREMENTAL_QUIET_MS);

    gptSegTimers.set(el, timer);
  }

  /* پیدا کردن کوچک‌ترین بخش‌های قابل‌segment مرتبط با یک mutation، بدون
     رفتن به ریشه‌ی کل پیام (که باعث rescan کامل پیام می‌شد). */
  function findSegmentTargets(node) {
    const targets = [];
    if (node.nodeType === 3) {
      const p = node.parentElement;
      if (p) {
        let seg = p;
        try {
          const closest = p.closest(CHATGPT_SEG_SELECTOR);
          if (closest) seg = closest;
        } catch (e) {}
        if (!isNeverSegmentTarget(seg)) targets.push(seg);
      }
      return targets;
    }
    if (node.nodeType !== 1) return targets;
    let matches = false;
    try { matches = node.matches(CHATGPT_SEG_SELECTOR); } catch (e) {}
    if (matches && !isNeverSegmentTarget(node)) {
      targets.push(node);
      return targets;
    }
    /* اگر خودِ node یک wrapper است (نه خودِ segment)، فرزندان قابل‌segment
       مستقیم آن را پیدا کن — بدون لمس بقیه‌ی پیام. */
    if (node.querySelectorAll) {
      let inner = [];
      try { inner = node.querySelectorAll(CHATGPT_SEG_SELECTOR); } catch (e) {}
      for (let i = 0; i < inner.length; i++) {
        if (!isNeverSegmentTarget(inner[i])) targets.push(inner[i]);
      }
    }
    if (targets.length === 0 && node.matches) {
      /* هیچ زیرگره‌ی قابل‌segment‌ای نبود (مثلاً متن مستقیماً داخل یک span
         بدون تگ بلوکی است) — خودِ node را در نظر بگیر تا متن جا نماند. */
      if (!isNeverSegmentTarget(node)) targets.push(node);
    }
    return targets;
  }

  function buildChatGptCss() {
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

    return `
      ${faces}

      [${CHATGPT_RTL_ATTR}="1"] {
        direction: rtl !important;
        text-align: right !important;
        unicode-bidi: isolate;
      }
      [${CHATGPT_FONT_ATTR}="1"] {
        font-family: '${FONT_FAMILY}', Tahoma, Arial, sans-serif !important;
        /* رفع پرش/فلیکر بصری: چون رندر تدریجی است و فونت روی هر بخش به‌محض
           آماده‌شدنش اعمال می‌شود (نه در پایان کل پیام)، یک fade ملایم
           باعث می‌شود تغییر فونت به چشم نپرد. فقط opacity تغییر می‌کند،
           بدون تأثیر روی اندازه یا موقعیت (بدون layout shift). */
        animation: fa-ext-gpt-fade-in .12s ease-out;
      }
      @keyframes fa-ext-gpt-fade-in {
        from { opacity: .55; }
        to   { opacity: 1; }
      }

      [${CHATGPT_RTL_ATTR}="1"] :is(${CHATGPT_NEVER_RTL_SELECTOR}) {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate;
      }
      [${CHATGPT_FONT_ATTR}="1"] :is(${CHATGPT_NEVER_RTL_SELECTOR}) {
        font-family: unset !important;
      }
    `;
  }

  const chatGptStyleEl = document.createElement('style');
  chatGptStyleEl.id = CHATGPT_STYLE_ID;
  function injectChatGptStyles() {
    chatGptStyleEl.textContent = buildChatGptCss();
    if (!chatGptStyleEl.isConnected) {
      (document.head || document.documentElement).appendChild(chatGptStyleEl);
    }
  }

  function isChatGptMessageDone(el) {
    return el.getAttribute(CHATGPT_DONE_ATTR) === '1';
  }

  function applyChatGptDirectives(el) {
    if (!masterActive()) return;
    let text = '';
    try { text = el.textContent || ''; } catch (e) { return; }
    if (!text.trim()) return;
    const persian = isPersianDominant(text);
    if (eff.rtl && persian) el.setAttribute(CHATGPT_RTL_ATTR, '1');
    else el.removeAttribute(CHATGPT_RTL_ATTR);
    if (eff.font && persian) el.setAttribute(CHATGPT_FONT_ATTR, '1');
    else el.removeAttribute(CHATGPT_FONT_ATTR);
  }

  /* پایان استریم یک پیام: به‌جای پردازش کل پیام از صفر، فقط بخش‌هایی که
     هنوز attribute نگرفته‌اند (مثلاً چند کلمه‌ی آخر که به segment قبلی
     نچسبیده بودند) پردازش می‌شوند. بخش‌هایی که در حین استریم قبلاً
     applyChatGptSegmentDirectives گرفته‌اند، دست‌نخورده باقی می‌مانند —
     نه دوباره پردازش می‌شوند و نه محتوایشان لمس می‌شود. */
  function finalizeChatGptMessage(el) {
    if (!el || !el.isConnected) return;
    if (isChatGptMessageDone(el)) return;
    el.setAttribute(CHATGPT_DONE_ATTR, '1');

    /* لغو تایمرهای segment معلق روی این پیام و پردازش فوری همان بخش‌ها،
       تا کاربر منتظر GPT_INCREMENTAL_QUIET_MS دیگری نماند. */
    let segs = [];
    try { segs = el.querySelectorAll(CHATGPT_SEG_SELECTOR); } catch (e) {}
    let touchedAny = false;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (isNeverSegmentTarget(seg)) continue;
      const t = gptSegTimers.get(seg);
      if (t) { clearTimeout(t); gptSegTimers.delete(seg); }
      applyChatGptSegmentDirectives(seg);
      touchedAny = true;
    }

    /* اگر پیام هیچ بخش قابل‌segment‌ای نداشت (متن مستقیماً داخل کانتینر
       پیام است، بدون <p>/<li>)، به‌صورت fallback خودِ پیام را پردازش کن —
       این تنها موردی است که کل پیام لمس می‌شود و فقط attribute‌گذاری است،
       نه دستکاری DOM. */
    if (!touchedAny) applyChatGptDirectives(el);
  }

  const gptFinalizeTimers = new WeakMap();
  const GPT_QUIET_MS = 900;

  function scheduleChatGptFinalize(el) {
    if (!el || isChatGptMessageDone(el)) return;
    const prevTimer = gptFinalizeTimers.get(el);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(() => {
      gptFinalizeTimers.delete(el);
      finalizeChatGptMessage(el);
    }, GPT_QUIET_MS);
    gptFinalizeTimers.set(el, timer);
  }

  function findChatGptMessageAncestor(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    let depth = 0;
    while (el && el !== document.body && depth < 40) {
      if (el.matches && el.matches(CHATGPT_MESSAGE_SELECTOR)) return el;
      el = el.parentElement;
      depth++;
    }
    return null;
  }

  function scanExistingChatGptMessages() {
    if (!document.body || !document.body.querySelectorAll) return;
    let nodes;
    try { nodes = document.body.querySelectorAll(CHATGPT_MESSAGE_SELECTOR); } catch (e) { return; }
    for (let i = 0; i < nodes.length; i++) {
      if (!isChatGptMessageDone(nodes[i])) scheduleChatGptFinalize(nodes[i]);
    }
  }

  let chatGptObserver = null;

  /* از یک mutation، فقط بخش‌های (segment) واقعاً تغییریافته را استخراج و
     برای پردازش تدریجی زمان‌بندی می‌کند. هرگز کل پیام را rescan نمی‌کند؛
     فقط همان node تازه‌اضافه‌شده/تغییریافته و نزدیک‌ترین اجداد قابل‌segment آن. */
  function scheduleIncrementalSegmentsForMutation(m, msgAncestor) {
    if (!msgAncestor || isChatGptMessageDone(msgAncestor)) return;

    if (m.type === 'childList' && m.addedNodes.length) {
      for (let i = 0; i < m.addedNodes.length; i++) {
        const n = m.addedNodes[i];
        const targets = findSegmentTargets(n);
        for (let j = 0; j < targets.length; j++) scheduleChatGptSegment(targets[j]);
      }
      return;
    }

    if (m.type === 'characterData') {
      const targets = findSegmentTargets(m.target);
      for (let j = 0; j < targets.length; j++) scheduleChatGptSegment(targets[j]);
    }
  }

  function startChatGptObserver() {
    if (chatGptObserver || !document.body) return;
    chatGptObserver = new MutationObserver(mutations => {
      if (!masterActive()) return;
      for (const m of mutations) {
        try {
          if (m.type === 'childList' && m.addedNodes.length) {
            for (let i = 0; i < m.addedNodes.length; i++) {
              const n = m.addedNodes[i];
              if (n.nodeType !== 1) continue;
              if (n.matches && n.matches(CHATGPT_MESSAGE_SELECTOR) && !isChatGptMessageDone(n)) {
                scheduleChatGptFinalize(n);
              }
              if (n.querySelectorAll) {
                const inner = n.querySelectorAll(CHATGPT_MESSAGE_SELECTOR);
                for (let j = 0; j < inner.length; j++) {
                  if (!isChatGptMessageDone(inner[j])) scheduleChatGptFinalize(inner[j]);
                }
              }
            }
          }
          const ancestor = findChatGptMessageAncestor(m.target);
          if (ancestor && !isChatGptMessageDone(ancestor)) {
            /* زمان‌بندی نهایی‌سازی کل پیام (fallback پس از سکوت طولانی) — 
               همچنان حفظ می‌شود تا اگر incremental به هر دلیلی بخشی را از
               قلم انداخت، در پایان جبران شود. */
            scheduleChatGptFinalize(ancestor);
            /* رندر تدریجی واقعی: فقط همان بخش کوچکِ تغییریافته را
               زمان‌بندی کن، نه کل پیام. */
            scheduleIncrementalSegmentsForMutation(m, ancestor);
          }
        } catch (e) {}
      }
    });

    try {
      chatGptObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } catch (e) {}
  }

  function startChatGptCompatMode() {
    try { injectChatGptStyles(); } catch (e) {}
    scanExistingChatGptMessages();
    startChatGptObserver();
  }

  function refreshChatGptDoneMessages() {
    if (!document.body || !document.body.querySelectorAll) return;
    /* پیام‌هایی که از مسیر fallback (بدون segment) پردازش شده‌اند */
    let nodes;
    try {
      nodes = document.body.querySelectorAll(
        CHATGPT_MESSAGE_SELECTOR + '[' + CHATGPT_DONE_ATTR + '="1"]'
      );
    } catch (e) { return; }
    for (let i = 0; i < nodes.length; i++) applyChatGptDirectives(nodes[i]);

    /* بخش‌هایی که قبلاً به‌صورت تدریجی attribute گرفته‌اند نیز باید با
       تنظیمات جدید (مثلاً خاموش‌شدن راست‌چین) هماهنگ شوند. فقط
       attribute‌شان به‌روزرسانی می‌شود، هیچ DOM ای rescan/rebuild نمی‌شود. */
    let segs;
    try {
      segs = document.body.querySelectorAll(
        `[${CHATGPT_RTL_ATTR}="1"], [${CHATGPT_FONT_ATTR}="1"]`
      );
    } catch (e) { return; }
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (seg.matches && seg.matches(CHATGPT_MESSAGE_SELECTOR)) continue; // already handled above
      applyChatGptSegmentDirectives(seg);
    }
  }

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
        /* دفاع لایه‌ی دوم در برابر باگ «زوم مداوم»: text node داخلی که
           با textContent= ساخته شد هم باید صراحتاً ثبت شود، تا اگر روزی
           جایی خارج از treeWalkerFilter اصلی این زیر‌درخت را پیمایش کرد،
           باز هم به‌عنوان «قبلاً پردازش‌شده» شناخته شود و دوباره در یک
           span.fa-ext-fa دیگر پیچیده نشود. */
        if (span.firstChild) faExtGenerated.add(span.firstChild);
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
        /* رفع باگ «زوم مداوم فونت روی Kick»: هر متنی که داخل یک
           span.fa-ext-fa (یا هر فرزندی از آن) است از قبل توسط خودِ اسکریپت
           تولید شده و هرگز نباید دوباره segment شود؛ وگرنه با هر
           mutation ناشیِ از خودِ اسکریپت دوباره پردازش و در یک span تو در
           تویِ دیگر پیچیده می‌شود و این چرخه هرگز متوقف نمی‌شود. */
        if (p.closest && p.closest('.' + FONT_SPAN_CLASS)) return NodeFilter.FILTER_REJECT;
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

    /* ChatGPT از یک مسیر کاملاً جدا و غیرتهاجمی عبور می‌کند؛ هرگز به
       fullScan/startMutationObserver عمومی (که DOM را تجزیه می‌کند) نمی‌رسد. */
    if (isChatGptHost(host)) {
      let gptBootRan = false;
      function runGptOnce() {
        if (gptBootRan) return;
        gptBootRan = true;
        startChatGptCompatMode();
      }

      if (document.body) {
        runGptOnce();
      } else {
        document.addEventListener('DOMContentLoaded', runGptOnce, { once: true });
        document.addEventListener('readystatechange', () => {
          if (document.readyState === 'interactive' || document.readyState === 'complete') {
            if (masterActive()) runGptOnce();
          }
        }, { once: true });
      }

      window.addEventListener('load', () => {
        if (masterActive()) scanExistingChatGptMessages();
      }, { once: true });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && masterActive()) scanExistingChatGptMessages();
      });

      return;
    }

    /* Kick.com از یک مسیر کاملاً جدا عبور می‌کند که اولویت را به پایداری
       و سرعت لود صفحه می‌دهد، نه پردازش تهاجمی. هیچ اسکن/observer ای
       قبل از لود کامل صفحه شروع نمی‌شود. */
    if (isKickHost(host)) {
      startKickCompatMode();
      return;
    }

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

      if (isChatGptHost(host)) {
        try { injectChatGptStyles(); } catch (e) {}
        if (masterActive() && document.body) {
          if (!chatGptObserver) startChatGptObserver();
          /* فقط attribute پیام‌های قبلاً پردازش‌شده به‌روزرسانی می‌شود؛
             هیچ ساختار DOM ای دوباره لمس نمی‌شود. */
          refreshChatGptDoneMessages();
          scanExistingChatGptMessages();
        }
        return;
      }

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
