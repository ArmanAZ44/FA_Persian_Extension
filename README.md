<div align="center">

# فا | راست‌چین‌ساز و فونت فارسی
### FA | Persian Font & RTL Extension for Chrome

افزونه‌ی مرورگر کروم (Manifest V3) برای اعمال فونت فارسی **وزیرمتن**، اندازه‌ی هوشمند، و راست‌چینِ اختیاریِ هر سایت روی متن صفحات وب.

A Manifest V3 Chrome extension that applies the **Vazirmatn** Persian font, smart per‑element sizing, and optional per‑site RTL to web page text.

[![GitHub](https://img.shields.io/badge/GitHub-ArmanAZ44-0a0a0a?logo=github)](https://github.com/ArmanAZ44/FA_Persian_Extension)
[![Telegram](https://img.shields.io/badge/Telegram-armanaz__44-229ED9?logo=telegram&logoColor=white)](https://t.me/armanaz_44)

</div>

---

## 🇮🇷 فارسی

### ✨ ویژگی‌ها
- **فونت فارسی هوشمند:** فونت وزیرمتن فقط روی بخش‌های فارسیِ متن اعمال می‌شود؛ **متن انگلیسی سایت هرگز تغییر نمی‌کند.**
- **اندازه‌ی هوشمند:** اندازه‌ی فونت فارسی بر اساس نوع عنصر (تیتر، پاراگراف، دکمه و …) تنظیم می‌شود تا هماهنگ دیده شود.
- **راست‌چین هر سایت:** راست‌چین به‌صورت پیش‌فرض خاموش است و برای هر سایت جداگانه از پاپ‌آپ روشن می‌شود.
- **حین تایپ:** فونت و راست‌چین در فیلدهای فرم و ویرایشگرهای متنی (contenteditable) هم اعمال می‌شود (ویرایشگرهای کد استثنا هستند).
- **تنظیمات اختصاصی هر دامنه، ارقام فارسی، اصلاح فاصله‌ها، تایپوگرافی و ترجمه‌ی سریع.**
- دامنه‌های `.ir` به‌طور خودکار مستثنا هستند.

### 🧩 نصب دستی روی کروم (حالت توسعه‌دهنده)
1. فایل ZIP افزونه را دانلود و **از حالت فشرده خارج کنید** (Extract) تا یک پوشه به‌دست آید (پوشه باید شامل `manifest.json` باشد).
2. در کروم به آدرس زیر بروید:
   ```
   chrome://extensions
   ```
3. از گوشه‌ی بالا‑راست، **حالت توسعه‌دهنده (Developer mode)** را روشن کنید.
4. روی **«بارگذاری افزونهٔ باز‑شده» (Load unpacked)** کلیک کنید.
5. **پوشه‌ی اکسترکت‌شده** (همان پوشه‌ای که `manifest.json` داخلش است) را انتخاب کنید.
6. تمام! آیکون «ف» را در نوار افزونه‌ها می‌بینید. برای تنظیمات هر سایت روی آن کلیک کنید.

> نکته: اگر پوشه‌ی اشتباه (مثلاً پوشه‌ی والد) را انتخاب کنید، خطای «Manifest file is missing or unreadable» می‌گیرید. حتماً پوشه‌ای را انتخاب کنید که `manifest.json` مستقیماً داخل آن است.

### ⌨️ میانبرها
- `Alt+Shift+F` → روشن/خاموش کردن کلی افزونه
- `Alt+Shift+S` → روشن/خاموش کردن راست‌چین در سایت جاری
- `Alt+Shift+T` → ترجمه‌ی سریع متن انتخاب‌شده (در صورت فعال بودن)

### 🔄 به‌روزرسانی
پس از دریافت نسخه‌ی جدید، فایل‌ها را جایگزین کنید و در صفحه‌ی `chrome://extensions` روی دکمه‌ی **↻ (Reload)** افزونه بزنید.

---

## 🇬🇧 English

### ✨ Features
- **Smart Persian font:** Vazirmatn is applied only to the Persian parts of the text — the site's **English text is never changed.**
- **Smart sizing:** Persian font size is tuned per element type (heading, paragraph, button, …) for visual balance.
- **Per‑site RTL:** RTL is off by default and enabled per website from the popup.
- **While typing:** font and RTL also apply inside form fields and rich‑text (contenteditable) editors — code editors are excluded.
- **Per‑domain overrides, Persian digits, spacing fixes, typography, and quick translate.**
- `.ir` domains are auto‑excluded.

### 🧩 Manual install on Chrome (Developer mode)
1. Download the extension ZIP and **extract it** into a folder (the folder must contain `manifest.json`).
2. Open Chrome and go to:
   ```
   chrome://extensions
   ```
3. Turn on **Developer mode** (top‑right toggle).
4. Click **Load unpacked**.
5. Select the **extracted folder** (the one that directly contains `manifest.json`).
6. Done! The "ف" icon appears in the toolbar. Click it to configure each site.

> Tip: Selecting the wrong folder (e.g. a parent folder) causes a "Manifest file is missing or unreadable" error. Make sure the folder you pick has `manifest.json` directly inside it.

### ⌨️ Shortcuts
- `Alt+Shift+F` → toggle the whole extension
- `Alt+Shift+S` → toggle RTL on the current site
- `Alt+Shift+T` → quick‑translate the selected text (if enabled)

### 🔄 Updating
After getting a new build, replace the files and click the **↻ Reload** button on the extension card in `chrome://extensions`.

---

## 🔗 Links / پیوندها
- **GitHub:** https://github.com/ArmanAZ44/FA_Persian_Extension
- **Telegram:** https://t.me/armanaz_44
- **حمایت / Support:** https://reymit.ir/armanaz44

## 📄 License / مجوز
Free & open source. فونت وزیرمتن تحت مجوز OFL منتشر شده است / Vazirmatn font is licensed under the SIL OFL.

<div align="center">
ساخته‌شده با ♥ برای وب فارسی — Made with ♥ for the Persian web
</div>
