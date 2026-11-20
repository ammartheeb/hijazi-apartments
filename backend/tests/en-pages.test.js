const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND = path.join(__dirname, "../../frontend");
const SITE = "https://www.hijazi-apartments.com";
const { build, PAGES, TWINS } = require("../../scripts/build-en-pages.js");
const indexnow = require("../../scripts/indexnow.js");

const read = file => fs.readFileSync(path.join(FRONTEND, file), "utf8");

test("English pages are in sync with their Arabic pages", () => {
    // If this fails: run `node scripts/build-en-pages.js` from the project root.
    assert.deepEqual(build({ check: true }), []);
});

test("English and Arabic twins point at each other and declare their language", () => {
    const sitemap = read("sitemap.xml");

    for (const page of PAGES) {
        const ar = read(page.ar);
        const en = read(page.en);
        const arUrl = page.arUrl || `${SITE}/${page.ar}`;
        const arHref = page.arHref || page.ar;

        for (const html of [ar, en]) {
            assert.ok(html.includes(`hreflang="ar" href="${arUrl}"`), `${page.ar}: hreflang ar`);
            assert.ok(html.includes(`hreflang="en" href="${SITE}/${page.en}"`), `${page.ar}: hreflang en`);
            assert.ok(html.includes(`window.HIJAZI_ALT_PAGES = { ar: "${arHref}", en: "${page.en}" }`), `${page.ar}: language switch`);
        }

        assert.ok(ar.includes('<html lang="ar" dir="rtl">'), `${page.ar}: lang`);
        assert.ok(ar.includes('window.HIJAZI_PAGE_LANG = "ar"'), `${page.ar}: page language`);
        assert.ok(ar.includes(`<link rel="canonical" href="${arUrl}">`), `${page.ar}: canonical`);

        assert.ok(en.includes('<html lang="en" dir="ltr">'), `${page.en}: lang`);
        assert.ok(en.includes('window.HIJAZI_PAGE_LANG = "en"'), `${page.en}: page language`);
        assert.ok(en.includes(`<link rel="canonical" href="${SITE}/${page.en}">`), `${page.en}: canonical`);
        assert.doesNotMatch(en, /data-(?:en|src-en|alt-en|aria-en|href-en|en-href)=/);

        // روابط الصفحة الإنجليزية تروح للنسخ الإنجليزية (ما عدا زر "العربية")
        const arabicLinks = [...en.matchAll(/href="([^"#?]*)/g)].map(m => m[1]).filter(href => TWINS[href] && href !== arHref);
        assert.deepEqual(arabicLinks, [], `${page.en}: links to Arabic pages`);

        assert.ok(sitemap.includes(`<loc>${SITE}/${page.en}</loc>`), `${page.en} missing from sitemap.xml`);
    }
});

test("English pages have valid scripts and data and no Arabic text left", () => {
    const allowed = ["شقق حجازي المفروشة", "العربية"];

    for (const page of PAGES) {
        const html = read(page.en);

        for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
            if (/application\/ld\+json/i.test(match[1])) {
                const json = JSON.parse(match[2]);
                assert.doesNotMatch(JSON.stringify(json).replace(/شقق حجازي المفروشة/g, ""), /"(?:name|text|description)":"[^"]*[؀-ۿ]/, `${page.en}: Arabic in structured data`);
            } else {
                new vm.Script(match[2], { filename: page.en });
            }
        }

        let visible = html
            .replace(/<script[\s\S]*?<\/script>/g, " ")
            .replace(/<style[\s\S]*?<\/style>/g, " ")
            .replace(/<!--[\s\S]*?-->/g, " ")
            .replace(/<[^>]+>/g, " ");
        for (const word of allowed) visible = visible.split(word).join(" ");
        assert.doesNotMatch(visible, /[؀-ۿ]/, `${page.en}: Arabic text left in the page`);

        const attributes = html.replace(/<script[\s\S]*?<\/script>/g, " ").match(/\s(?:alt|aria-label|title|placeholder|content)="[^"]*"/g) || [];
        for (const attr of attributes) {
            assert.doesNotMatch(attr.replace(/شقق حجازي المفروشة/g, ""), /[؀-ۿ]/, `${page.en}: Arabic in ${attr.slice(0, 60)}`);
        }
    }
});

test("IndexNow key file is published and the admin page is never sent", () => {
    assert.equal(read(`${indexnow.KEY}.txt`).trim(), indexnow.KEY);
    assert.equal(indexnow.pageUrl("frontend/admin.html"), null);
    assert.equal(indexnow.pageUrl("frontend/index.html"), `${SITE}/`);
    assert.equal(indexnow.pageUrl("frontend/about-en.html"), `${SITE}/about-en.html`);
    assert.ok(indexnow.sitemapUrls().includes(`${SITE}/faq-en.html`));
    assert.ok(indexnow.sitemapUrls().includes(`${SITE}/index-en.html`));
});
