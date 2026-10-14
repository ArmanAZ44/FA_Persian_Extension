/**
 * فا | پس‌زمینه‌ی افزونه
 * نسخه ۲.۰.۰
 * مدیریت منوی راست‌کلیک، میانبرهای صفحه‌کلید، نشان (badge) آیکون و ترجمه.
 *
 * مدل جدید:
 *   • کلید اصلی (faEnabled) سراسری است.
 *   • راست‌چین (RTL) به‌ازای هر دامنه در faSiteOverrides[host].rtl ذخیره می‌شود.
 *
 * نکته نسخه ۲.۰.۰:
 *   فهرست کامل دامنه‌های مستثنا (excluded-domains-data.js) هم در پس‌زمینه
 *   بارگذاری می‌شود تا نشان (badge) و منوی راست‌کلیک برای هزاران سایت
 *   فارسی‌زبانِ غیر .ir هم وضعیت درست نشان دهند.
 */

if (typeof importScripts === 'function') {
  /* Chrome/Edge (service worker) */
  importScripts('excluded-domains-data.js', 'exclusions.js');
}

const DEF = FaExtExclusions.DEFAULTS;

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(Object.keys(DEF), (res) => {
      if (chrome.runtime.lastError || !res) {
        resolve({ ...DEF });
      } else {
        resolve({ ...DEF, ...res });
      }
    });
  });
}

function saveSettings(partial) {
  return new Promise((resolve) => chrome.storage.sync.set(partial, resolve));
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch (e) { return ''; }
}

/* تغییر یک کلید override برای یک دامنه (toggle نسبت به مقدار مؤثر فعلی). */
async function toggleSiteKey(host, key) {
  if (!host || FaExtExclusions.isHardExcluded(host)) return;
  const settings = await getSettings();
  const eff = FaExtExclusions.resolveSite(settings, host);
  const overrides = { ...(settings.faSiteOverrides || {}) };
  const site = { ...(overrides[host] || {}) };
  const current = key === 'rtl' ? eff.rtl : key === 'enabled' ? eff.enabled : eff.font;
  site[key] = !current;
  overrides[host] = site;
  await saveSettings({ faSiteOverrides: overrides });
}

async function updateBadgeForTab(tabId, url) {
  try {
    const settings = await getSettings();
    const host = hostOf(url);
    const eff = FaExtExclusions.resolveSite(settings, host);

    let text = '';
    let color = '#16a34a';
    if (!host || eff.hardExcluded || !eff.enabled) {
      text = 'off';
      color = '#c0392b';
    } else if (eff.rtl) {
      text = 'ر';       // راست‌چین روشن
      color = '#2563eb';
    } else {
      text = '';        // فقط‌فونت (پیش‌فرض)
    }
    const actionApi = (typeof chrome !== 'undefined' && chrome.action)
      ? chrome.action
      : (typeof browser !== 'undefined' && browser.action)
      ? browser.action
      : (typeof chrome !== 'undefined' && chrome.browserAction)
      ? chrome.browserAction
      : null;
    if (actionApi) {
      await actionApi.setBadgeText({ tabId, text });
      if (text) await actionApi.setBadgeBackgroundColor({ tabId, color });
    }
  } catch (e) {}
}

function rebuildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'fa-toggle-rtl',
      title: 'راست‌چین کردن / لغو راست‌چین در این سایت',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'fa-toggle-site',
      title: 'فعال/غیرفعال کردن «فا» در این سایت',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'fa-toggle-master',
      title: 'فعال/غیرفعال کردن کلی افزونه',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'fa-open-options',
      title: 'تنظیمات پیشرفته افزونه فا',
      contexts: ['page']
    });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await getSettings();
  await saveSettings(existing);
  rebuildContextMenus();
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    rebuildContextMenus();
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.url) return;
  const host = hostOf(tab.url);

  if (info.menuItemId === 'fa-open-options') {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (info.menuItemId === 'fa-toggle-master') {
    const settings = await getSettings();
    await saveSettings({ faEnabled: !settings.faEnabled });
  } else if (info.menuItemId === 'fa-toggle-site') {
    await toggleSiteKey(host, 'enabled');
  } else if (info.menuItemId === 'fa-toggle-rtl') {
    await toggleSiteKey(host, 'rtl');
  } else {
    return;
  }
  await updateBadgeForTab(tab.id, tab.url);
  try { await chrome.tabs.reload(tab.id); } catch (e) {}
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-extension') {
    const settings = await getSettings();
    await saveSettings({ faEnabled: !settings.faEnabled });
  } else if (command === 'toggle-site') {
    if (!tab || !tab.url) return;
    await toggleSiteKey(hostOf(tab.url), 'rtl');
  }
  if (tab && tab.id) {
    await updateBadgeForTab(tab.id, tab.url);
    try { await chrome.tabs.reload(tab.id); } catch (e) {}
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url) await updateBadgeForTab(tabId, tab.url);
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    await updateBadgeForTab(tabId, tab.url);
  }
});

chrome.storage.onChanged.addListener(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) await updateBadgeForTab(tab.id, tab.url);
  } catch (e) {}
});

/* ───── ترجمه ───── */
async function translateWithGoogle(text, targetLang) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
    encodeURIComponent(targetLang || 'fa') + '&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error('translate request failed');
  const data = await res.json();
  return (data[0] || []).map((seg) => seg[0]).join('');
}

/* مدیریت پیام‌ها به‌صورت یکپارچه جهت جلوگیری از بسته‌شدن پیش‌ازموعد پورت پیام در فایرفاکس */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return false;
  if (msg.type === 'faExtGetAllSettings') {
    getSettings()
      .then((s) => sendResponse(s))
      .catch(() => sendResponse({ ...DEF }));
    return true;
  }
  if (msg.type === 'faExtTranslate') {
    translateWithGoogle(msg.text, 'fa')
      .then((translated) => sendResponse({ translated }))
      .catch(() => sendResponse({ translated: null }));
    return true;
  }
  return false;
});
