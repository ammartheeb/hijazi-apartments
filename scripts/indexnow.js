#!/usr/bin/env node
/* =========================================================
   HIJAZI Apartments – إرسال الصفحات فورًا لمحركات البحث (IndexNow)
   =========================================================
   IndexNow بروتوكول مفتوح: بنبلّغ فيه Bing (ومحركات ثانية مثل Yandex
   و Seznam و Naver) إنه صفحة جديدة أو تغيّرت، فبتنزل بالفهرس بسرعة.
   ChatGPT و Copilot بيعتمدوا على فهرس Bing.

   المفتاح: frontend/<KEY>.txt (ملف عام بالموقع، مش سرّ؛ هيك البروتوكول).

   الاستخدام (من جذر المشروع):
       node scripts/indexnow.js --all                    كل الروابط اللي بالـ sitemap
       node scripts/indexnow.js --changed <from> <to>    الصفحات اللي تغيّرت بين commitين
       node scripts/indexnow.js about-en.html faq.html   صفحات محددة
       ... --dry                                         يطبع الروابط بدون إرسال

   بيشتغل لحاله بعد كل push على main من .github/workflows/indexnow.yml
========================================================= */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const FRONTEND = path.join(ROOT, "frontend");
const HOST = "www.hijazi-apartments.com";
const SITE = "https://" + HOST;
const KEY = "369b4278ac4fd8eb7413bd3be9ebea07";
const ENDPOINT = "https://api.indexnow.org/indexnow";

// صفحات ما بنبعتها أبدًا (لوحة الإدارة مش للفهرسة)
const PRIVATE = new Set(["admin.html"]);

function sitemapUrls() {
    const xml = fs.readFileSync(path.join(FRONTEND, "sitemap.xml"), "utf8");
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
}

function pageUrl(file) {
    const name = path.basename(String(file).replace(/\\/g, "/"));
    if (!/\.html$/i.test(name) || PRIVATE.has(name)) return null;
    if (!fs.existsSync(path.join(FRONTEND, name))) return null;
    return name === "index.html" ? SITE + "/" : SITE + "/" + name;
}

function changedUrls(from, to) {
    const out = execFileSync("git", ["diff", "--name-only", from, to, "--", "frontend"], { cwd: ROOT, encoding: "utf8" });
    const files = out.split(/\r?\n/).filter(Boolean);
    // لو تغيّر ملف مشترك (main.js أو style.css) ما في صفحة محددة نبعتها؛ بنكتفي بالصفحات نفسها
    return files.map(pageUrl).filter(Boolean);
}

function pickUrls(args) {
    if (args.includes("--all")) return sitemapUrls();
    const i = args.indexOf("--changed");
    if (i !== -1) {
        const from = args[i + 1];
        const to = args[i + 2] || "HEAD";
        if (!from || /^0+$/.test(from)) return sitemapUrls();
        return changedUrls(from, to);
    }
    return args.filter(arg => !arg.startsWith("--")).map(pageUrl).filter(Boolean);
}

async function submit(urls) {
    const body = { host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls };
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body)
    });
    return response.status;
}

async function main() {
    const args = process.argv.slice(2);
    const urls = [...new Set(pickUrls(args))];

    if (!urls.length) {
        console.log("IndexNow: no pages to send.");
        return;
    }

    console.log(`IndexNow: ${urls.length} page(s)\n` + urls.join("\n"));
    if (args.includes("--dry")) return;

    const status = await submit(urls);
    // 200 = تم، 202 = استلمناها والمفتاح قيد التحقق؛ غير هيك خطأ
    console.log("IndexNow response:", status);
    if (status !== 200 && status !== 202) process.exitCode = 1;
}

module.exports = { KEY, HOST, sitemapUrls, pageUrl };

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
