/**
 * فا | دیکشنری هاور — واژه‌نامه‌ی کوچک انگلیسی به فارسی برای ویژگی
 * «نگه‌داشتن Alt و هاور روی کلمه‌ی انگلیسی».
 *
 * کاملاً آفلاین است (هیچ درخواست شبکه‌ای ارسال نمی‌شود) تا سریع، خصوصی و
 * بدون وابستگی به سرویس ترجمه باشد. فقط شامل واژه‌های پرکاربرد است.
 */
(function (root) {
  'use strict';

  const DICT = {
    a: 'یک', an: 'یک', the: '(حرف تعریف)', and: 'و', or: 'یا', but: 'اما', if: 'اگر',
    because: 'چون', so: 'پس', that: 'که / آن', this: 'این', these: 'این‌ها', those: 'آن‌ها',
    is: 'است', are: 'هستند', was: 'بود', were: 'بودند', be: 'بودن', been: 'بوده', being: 'بودن',
    am: 'هستم', do: 'انجام دادن', does: 'انجام می‌دهد', did: 'انجام داد', done: 'انجام‌شده',
    have: 'داشتن', has: 'دارد', had: 'داشت', will: 'خواهد', would: 'می‌شد', can: 'می‌تواند',
    could: 'می‌توانست', should: 'باید', must: 'باید', may: 'ممکن است', might: 'شاید',
    not: 'نه', no: 'نه', yes: 'بله', all: 'همه', some: 'بعضی', any: 'هر', every: 'هر',
    each: 'هر یک', both: 'هر دو', few: 'کم', many: 'بسیاری', much: 'زیاد', more: 'بیشتر',
    most: 'بیشترین', less: 'کمتر', least: 'کمترین', other: 'دیگر', another: 'دیگری',
    same: 'همان', different: 'متفاوت', such: 'چنین',

    i: 'من', you: 'تو / شما', he: 'او (مرد)', she: 'او (زن)', it: 'آن', we: 'ما', they: 'آن‌ها',
    me: 'من را', him: 'او را', her: 'او را', us: 'ما را', them: 'آن‌ها را',
    my: 'مال من', your: 'مال تو', his: 'مال او', its: 'مال آن', our: 'مال ما', their: 'مال آن‌ها',
    mine: 'مال من', yours: 'مال تو', ours: 'مال ما', theirs: 'مال آن‌ها',
    myself: 'خودم', yourself: 'خودت', himself: 'خودش', herself: 'خودش', itself: 'خودش',
    ourselves: 'خودمان', themselves: 'خودشان',

    who: 'چه کسی', whom: 'چه کسی را', whose: 'مال چه کسی', what: 'چه', which: 'کدام',
    when: 'کِی', where: 'کجا', why: 'چرا', how: 'چطور',

    in: 'در', on: 'روی', at: 'در', by: 'توسط', for: 'برای', with: 'با', without: 'بدون',
    about: 'درباره', against: 'علیه', between: 'بین', among: 'در میان', through: 'از طریق',
    during: 'در طول', before: 'قبل از', after: 'بعد از', above: 'بالای', below: 'زیر',
    under: 'زیر', over: 'روی / بیش از', into: 'به داخل', onto: 'روی', from: 'از',
    to: 'به', of: 'از', off: 'خاموش / جدا', out: 'بیرون', up: 'بالا', down: 'پایین',
    near: 'نزدیک', around: 'اطراف', across: 'در امتداد', along: 'در طول', behind: 'پشت',
    beside: 'کنار', inside: 'داخل', outside: 'بیرون', within: 'در محدوده', until: 'تا',
    since: 'از (زمان)', while: 'در حالی که', than: 'نسبت به',

    good: 'خوب', bad: 'بد', great: 'عالی', nice: 'خوب / دلپذیر', new: 'جدید', old: 'قدیمی',
    young: 'جوان', big: 'بزرگ', small: 'کوچک', large: 'بزرگ', little: 'کوچک', long: 'طولانی',
    short: 'کوتاه', high: 'بلند', low: 'پایین', fast: 'سریع', slow: 'کند', easy: 'آسان',
    hard: 'سخت', difficult: 'دشوار', simple: 'ساده', important: 'مهم', beautiful: 'زیبا',
    ugly: 'زشت', happy: 'خوشحال', sad: 'ناراحت', angry: 'عصبانی', tired: 'خسته', hungry: 'گرسنه',
    thirsty: 'تشنه', hot: 'داغ', cold: 'سرد', warm: 'گرم', cool: 'خنک', clean: 'تمیز',
    dirty: 'کثیف', full: 'پر', empty: 'خالی', open: 'باز', closed: 'بسته', free: 'رایگان / آزاد',
    busy: 'شلوغ / مشغول', cheap: 'ارزان', expensive: 'گران', strong: 'قوی', weak: 'ضعیف',
    rich: 'ثروتمند', poor: 'فقیر', safe: 'امن', dangerous: 'خطرناک', true: 'درست', false: 'نادرست',
    right: 'درست / راست', wrong: 'اشتباه', left: 'چپ', early: 'زود', late: 'دیر', ready: 'آماده',
    sure: 'مطمئن', possible: 'ممکن', impossible: 'غیرممکن', necessary: 'لازم', special: 'خاص',
    normal: 'عادی', usual: 'معمول', real: 'واقعی', whole: 'کامل / تمام', entire: 'کامل',

    go: 'رفتن', come: 'آمدن', see: 'دیدن', look: 'نگاه کردن', watch: 'تماشا کردن',
    hear: 'شنیدن', listen: 'گوش دادن', say: 'گفتن', tell: 'گفتن', speak: 'صحبت کردن',
    talk: 'صحبت کردن', ask: 'پرسیدن', answer: 'پاسخ دادن', know: 'دانستن', think: 'فکر کردن',
    believe: 'باور داشتن', understand: 'فهمیدن', remember: 'به یاد آوردن', forget: 'فراموش کردن',
    learn: 'یاد گرفتن', teach: 'آموزش دادن', study: 'مطالعه کردن', read: 'خواندن',
    write: 'نوشتن', draw: 'کشیدن', make: 'ساختن', build: 'ساختن', create: 'ایجاد کردن',
    break: 'شکستن', fix: 'تعمیر کردن', repair: 'تعمیر کردن', change: 'تغییر دادن',
    start: 'شروع کردن', begin: 'شروع کردن', finish: 'تمام کردن', end: 'پایان دادن',
    stop: 'متوقف کردن', continue: 'ادامه دادن', keep: 'نگه داشتن', hold: 'نگه داشتن',
    give: 'دادن', take: 'گرفتن', get: 'گرفتن / رسیدن', bring: 'آوردن', send: 'فرستادن',
    receive: 'دریافت کردن', buy: 'خریدن', sell: 'فروختن', pay: 'پرداختن', spend: 'خرج کردن',
    save: 'ذخیره کردن / پس‌انداز کردن', find: 'پیدا کردن', lose: 'گم کردن', search: 'جستجو کردن',
    try: 'تلاش کردن', want: 'خواستن', need: 'نیاز داشتن', like: 'دوست داشتن', love: 'عشق ورزیدن',
    hate: 'متنفر بودن', wish: 'آرزو کردن', hope: 'امیدوار بودن', wait: 'منتظر ماندن',
    stay: 'ماندن', leave: 'ترک کردن', arrive: 'رسیدن', enter: 'وارد شدن', exit: 'خارج شدن',
    walk: 'راه رفتن', run: 'دویدن', jump: 'پریدن', sit: 'نشستن', stand: 'ایستادن',
    sleep: 'خوابیدن', wake: 'بیدار شدن', eat: 'خوردن', drink: 'نوشیدن', cook: 'پختن',
    play: 'بازی کردن', work: 'کار کردن', use: 'استفاده کردن', help: 'کمک کردن',
    close: 'بستن', turn: 'چرخیدن', move: 'حرکت کردن', pull: 'کشیدن',
    push: 'هل دادن', carry: 'حمل کردن', catch: 'گرفتن', throw: 'پرتاب کردن', hit: 'زدن',
    kill: 'کشتن', die: 'مردن', live: 'زندگی کردن', grow: 'رشد کردن', add: 'اضافه کردن',
    remove: 'حذف کردن', check: 'بررسی کردن', choose: 'انتخاب کردن', decide: 'تصمیم گرفتن',
    agree: 'موافقت کردن', disagree: 'مخالفت کردن', accept: 'پذیرفتن', refuse: 'رد کردن',
    allow: 'اجازه دادن', follow: 'دنبال کردن', lead: 'رهبری کردن', meet: 'ملاقات کردن',
    join: 'پیوستن', share: 'به اشتراک گذاشتن', show: 'نشان دادن', explain: 'توضیح دادن',
    describe: 'توصیف کردن', mean: 'معنی دادن', suggest: 'پیشنهاد دادن', offer: 'پیشنهاد دادن',
    require: 'نیاز داشتن', provide: 'فراهم کردن', include: 'شامل شدن', contain: 'در بر داشتن',
    happen: 'اتفاق افتادن', appear: 'ظاهر شدن', seem: 'به نظر رسیدن', become: 'شدن',
    feel: 'احساس کردن', touch: 'لمس کردن', smell: 'بو کردن', taste: 'چشیدن',

    time: 'زمان', day: 'روز', night: 'شب', morning: 'صبح', afternoon: 'بعدازظهر',
    evening: 'عصر', week: 'هفته', month: 'ماه', year: 'سال', hour: 'ساعت', minute: 'دقیقه',
    second: 'ثانیه', today: 'امروز', tomorrow: 'فردا', yesterday: 'دیروز', now: 'اکنون',
    then: 'سپس / آنگاه', soon: 'به‌زودی', always: 'همیشه', never: 'هرگز', sometimes: 'گاهی',
    often: 'اغلب', usually: 'معمولاً', already: 'قبلاً', still: 'هنوز', yet: 'هنوز',
    again: 'دوباره', once: 'یک‌بار', twice: 'دوبار',

    people: 'مردم', person: 'شخص', man: 'مرد', woman: 'زن', child: 'کودک', children: 'کودکان',
    baby: 'نوزاد', boy: 'پسر', girl: 'دختر', friend: 'دوست', family: 'خانواده',
    mother: 'مادر', father: 'پدر', parent: 'والدین', brother: 'برادر', sister: 'خواهر',
    son: 'پسر (فرزند)', daughter: 'دختر (فرزند)', husband: 'همسر (مرد)', wife: 'همسر (زن)',
    teacher: 'معلم', student: 'دانش‌آموز', doctor: 'پزشک', nurse: 'پرستار', engineer: 'مهندس',
    worker: 'کارگر', manager: 'مدیر', customer: 'مشتری', neighbor: 'همسایه', stranger: 'غریبه',
    guest: 'مهمان', owner: 'صاحب',

    house: 'خانه', home: 'خانه', room: 'اتاق', door: 'در', window: 'پنجره', wall: 'دیوار',
    floor: 'کف / طبقه', roof: 'سقف', kitchen: 'آشپزخانه', bathroom: 'حمام', bedroom: 'اتاق خواب',
    city: 'شهر', town: 'شهر (کوچک)', village: 'روستا', country: 'کشور', street: 'خیابان',
    road: 'جاده', building: 'ساختمان', school: 'مدرسه', university: 'دانشگاه', hospital: 'بیمارستان',
    office: 'دفتر', shop: 'مغازه', store: 'فروشگاه', market: 'بازار', restaurant: 'رستوران',
    hotel: 'هتل', park: 'پارک', garden: 'باغ', airport: 'فرودگاه', station: 'ایستگاه',

    car: 'ماشین', bus: 'اتوبوس', train: 'قطار', plane: 'هواپیما', bike: 'دوچرخه',
    bicycle: 'دوچرخه', ship: 'کشتی', boat: 'قایق', taxi: 'تاکسی',

    water: 'آب', food: 'غذا', bread: 'نان', rice: 'برنج', meat: 'گوشت', fruit: 'میوه',
    vegetable: 'سبزی', milk: 'شیر', tea: 'چای', coffee: 'قهوه', sugar: 'شکر', salt: 'نمک',
    egg: 'تخم‌مرغ', apple: 'سیب', book: 'کتاب', pen: 'خودکار', paper: 'کاغذ', table: 'میز',
    chair: 'صندلی', bed: 'تخت', phone: 'تلفن', computer: 'کامپیوتر', internet: 'اینترنت',
    money: 'پول', price: 'قیمت', job: 'شغل', business: 'کسب‌وکار', company: 'شرکت',
    project: 'پروژه', product: 'محصول', service: 'خدمات', question: 'سوال', answer2: 'جواب',
    problem: 'مشکل', solution: 'راه‌حل', reason: 'دلیل', result: 'نتیجه', example: 'مثال',
    idea: 'ایده', plan: 'برنامه', news: 'خبر', story: 'داستان', word: 'کلمه', language: 'زبان',
    name: 'نام', number: 'عدد', color: 'رنگ', sound: 'صدا', music: 'موسیقی', picture: 'عکس',
    image: 'تصویر', video: 'ویدئو', game: 'بازی', sport: 'ورزش', team: 'تیم', world: 'جهان',
    life: 'زندگی', health: 'سلامتی', weather: 'هوا', rain: 'باران', sun: 'خورشید',
    moon: 'ماه (آسمان)', star: 'ستاره', sky: 'آسمان', wind: 'باد', snow: 'برف', fire: 'آتش',
    tree: 'درخت', flower: 'گل', animal: 'حیوان', dog: 'سگ', cat: 'گربه', bird: 'پرنده',
    fish: 'ماهی',

    please: 'لطفاً', thanks: 'ممنون', thank: 'تشکر کردن', sorry: 'ببخشید',
    welcome: 'خوش آمدید', hello: 'سلام', hi: 'سلام', bye: 'خداحافظ', goodbye: 'خداحافظ',

    first: 'اول', last: 'آخر', next: 'بعدی', best: 'بهترین', worst: 'بدترین',
    only: 'تنها', also: 'همچنین', even: 'حتی', just: 'فقط', very: 'خیلی', too: 'هم / خیلی',
    quite: 'نسبتاً', enough: 'کافی', almost: 'تقریباً', maybe: 'شاید', perhaps: 'شاید',
    probably: 'احتمالاً', certainly: 'قطعاً', actually: 'در واقع', really: 'واقعاً',
    together: 'با هم', alone: 'تنها', here: 'اینجا', there: 'آنجا', everywhere: 'همه‌جا',
    somewhere: 'یک‌جایی', nowhere: 'هیچ‌جا', anywhere: 'هرجا'
  };

  const FaExtDictionary = { DICT };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaExtDictionary;
  } else {
    root.FaExtDictionary = FaExtDictionary;
  }
})(typeof self !== 'undefined' ? self : this);
