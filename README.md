<p align="center">
  <img src="build/icon-256.png" width="96" alt="Perch icon" />
</p>

<h1 align="center">Perch</h1>

<p align="center">A local-first <strong>Project Command Center</strong> for developers managing many software projects.</p>

<p align="center"><a href="#perch">English</a> · <a href="#فارسی">فارسی</a></p>

Not a task tracker — a single place to see what you have, what's active, what's broken, and what needs attention across every project you own.

Built as a desktop app (Electron + Next.js + SQLite) so it runs entirely on your machine, with real filesystem and git access, and no dependency on any cloud service.

## Download

Grab the latest build for your platform from the [Releases page](../../releases/latest) — macOS (Apple Silicon or Intel) and Windows (installer or portable) are available. No account, no cloud dependency, nothing phones home.

## Screenshots

| | |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Projects](screenshots/projects.png) |
| Dashboard | Projects |
| ![Tasks](screenshots/tasks-kanban.png) | ![System Map](screenshots/system-map.png) |
| Per-project Kanban tasks | System Map |
| ![Git status](screenshots/git-status.png) | ![Persian / RTL](screenshots/dashboard-farsi.png) |
| Read-only git status | Full English / Persian / Dutch UI, with RTL support |

## What it actually does

- Scans real project folders on disk — detects framework, language, package manager, database, git status, environment variable *names* (never values), and deployment config. Nothing about a project is invented; anything undetectable is shown as unknown.
- Tracks tasks, bugs, and a changelog per project (with an option to import changelog entries straight from git history).
- Generates project documentation (`CLAUDE.md`, `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `SETUP.md`, `API.md`, `DATABASE.md`, `CHANGELOG.md`) from what's actually recorded about a project — always as a diffable preview first, never overwriting an existing file without explicit confirmation.
- Shows read-only git status (branch, last commit, uncommitted files, remote) for every project. It never commits, pushes, resets, or otherwise touches git history.
- Plans project folder moves as a dry run — checks, warnings, and an explicit confirmation step before anything is moved on disk.
- Gives you a System Map of your whole software ecosystem and its external integrations.

See `SAFETY.md` for the full list of what this app will and will not do to your files.

## Running it

```bash
npm install
npm run db:seed   # optional — only if you want to seed from scripts/seed.ts
npm run dev        # opens at http://localhost:4100
```

To run as the actual desktop app:

```bash
npm run app
```

To build distributable installers:

```bash
npm run package:mac    # or package:win / package:linux
```

See `SETUP.md` for details, including the native-module rebuild step that's required for the desktop app specifically.

## Documentation map

- `USER_GUIDE.md` / `USER_GUIDE.fa.md` — every feature explained, plus install & run instructions (English / Persian)
- `CLAUDE.md` — instructions for a future Claude session working on this codebase
- `ARCHITECTURE.md` — how the pieces fit together
- `SETUP.md` — full setup, including the Electron native-module gotcha
- `PROJECT_STRUCTURE.md` — what's where
- `SAFETY.md` — exactly what destructive actions exist and how they're gated

---

<div dir="rtl">

## فارسی

<p align="center"><a href="#perch">English</a> · <a href="#فارسی">فارسی</a></p>

**Perch** یک **مرکز فرمان پروژه** محلی است، برای توسعه‌دهنده‌هایی که چند پروژه‌ی نرم‌افزاری را همزمان مدیریت می‌کنند.

این یک تسک‌تراکر ساده نیست — یک‌جا نشون می‌ده چی داری، چی فعاله، چی خرابه، و چی نیاز به توجه دارد، در همه‌ی پروژه‌هایی که داری.

به‌صورت یک اپ دسکتاپ (Electron + Next.js + SQLite) ساخته شده، پس کاملاً روی دستگاه خودت اجرا می‌شود، با دسترسی واقعی به فایل‌سیستم و گیت، و بدون وابستگی به هیچ سرویس کلود.

### دانلود

آخرین نسخه برای پلتفرم خودت رو از [صفحه‌ی Releases](../../releases/latest) بگیر — مک (اپل سیلیکون یا اینتل) و ویندوز (نصب‌کننده یا پرتابل) موجودند. بدون اکانت، بدون وابستگی به کلود، هیچ‌چیزی به بیرون ارسال نمی‌شود.

### قابلیت‌ها

- پوشه‌های واقعی پروژه روی دیسک را اسکن می‌کند — فریم‌ورک، زبان، مدیر پکیج، دیتابیس، وضعیت گیت، *نام* متغیرهای محیطی (هیچ‌وقت مقدارشان)، و تنظیمات دیپلوی را تشخیص می‌دهد. هیچ‌چیز درباره‌ی یک پروژه از خودش ساخته نمی‌شود؛ هرچه تشخیص‌ناپذیر باشد به‌عنوان نامشخص نشان داده می‌شود.
- تسک، باگ، و تاریخچه‌ی تغییرات را برای هر پروژه ردیابی می‌کند (با امکان وارد کردن مستقیم از تاریخچه‌ی گیت).
- داکیومنت پروژه (`CLAUDE.md`، `PROJECT_OVERVIEW.md`، `ARCHITECTURE.md`، `SETUP.md`، `API.md`، `DATABASE.md`، `CHANGELOG.md`) را از روی چیزهایی که واقعاً درباره‌ی پروژه ثبت شده می‌سازد — همیشه اول یک پیش‌نمایش قابل‌مقایسه، هیچ‌وقت بدون تأیید صریح بازنویسی نمی‌کند.
- وضعیت گیت را فقط‌خواندنی نشان می‌دهد (شاخه، آخرین کامیت، فایل‌های commit‌نشده، ریموت) برای هر پروژه. هیچ‌وقت commit، push، reset یا هر تغییر دیگری روی تاریخچه‌ی گیت انجام نمی‌دهد.
- جابه‌جایی پوشه‌های پروژه را به‌صورت یک اجرای آزمایشی برنامه‌ریزی می‌کند — بررسی‌ها، هشدارها، و یک مرحله‌ی تأیید صریح قبل از هر جابه‌جایی واقعی روی دیسک.
- یک نقشه‌ی سیستم از کل اکوسیستم نرم‌افزاری‌ات و یکپارچه‌سازی‌های خارجی‌اش به تو می‌دهد.
- رمز عبور اختیاری، و رابط کاربری کامل به انگلیسی / فارسی / هلندی با پشتیبانی از راست‌به‌چپ.

برای فهرست کامل اینکه این برنامه چه کارهایی با فایل‌هایت می‌کند و نمی‌کند، به `SAFETY.md` مراجعه کن.

### اجرا از سورس

```bash
npm install
npm run db:seed   # اختیاری — فقط اگر می‌خوای با scripts/seed.ts پُر شود
npm run dev        # روی http://localhost:4100 باز می‌شود
```

برای اجرا به‌عنوان اپ دسکتاپ واقعی:

```bash
npm run app
```

برای ساخت فایل نصبی:

```bash
npm run package:mac    # یا package:win / package:linux
```

برای جزئیات، از جمله مرحله‌ی rebuild ماژول‌های بومی که مخصوص اپ دسکتاپ لازم است، به `SETUP.md` مراجعه کن.

### نقشه‌ی داکیومنت‌ها

- `USER_GUIDE.md` / `USER_GUIDE.fa.md` — توضیح کامل هر قابلیت، به همراه نصب و اجرا (انگلیسی / فارسی)
- `CLAUDE.md` — دستورالعمل برای یک نشست Claude آینده که روی این کدبیس کار می‌کند
- `ARCHITECTURE.md` — چگونگی کنار هم قرار گرفتن قطعات
- `SETUP.md` — راه‌اندازی کامل، از جمله نکته‌ی ماژول بومی الکترون
- `PROJECT_STRUCTURE.md` — چی کجاست
- `SAFETY.md` — دقیقاً چه اقدامات مخربی وجود دارد و چطور کنترل می‌شوند

</div>
