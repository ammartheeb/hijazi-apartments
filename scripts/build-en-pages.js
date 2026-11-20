#!/usr/bin/env node
/* =========================================================
   HIJAZI Apartments – توليد النسخ الإنجليزية لصفحات: من نحن، الأسئلة، التقييمات
   =========================================================
   المصدر:  about.html و faq.html و reviews.html (العربي هو الأصل).
            النص الإنجليزي مكتوب داخلها:
              - about / reviews: في السمات data-en و data-src-en و data-alt-en
                و data-aria-en و data-href-en
              - faq: في المصفوفة faqData.en داخل سكربت الصفحة
   الناتج:  about-en.html و faq-en.html و reviews-en.html
            (صفحات إنجليزية ثابتة بروابط خاصة، ليقرأها Google و Bing والذكاء
            الاصطناعي بدون تشغيل JavaScript)

   الاستخدام (من جذر المشروع):
       node scripts/build-en-pages.js          يكتب الصفحات الإنجليزية
       node scripts/build-en-pages.js --check  يفحص فقط (يُستخدم في الاختبارات)

   عند تعديل أي من الصفحات العربية الثلاث: عدّل النص الإنجليزي جنبه (data-en
   أو faqData.en) ثم شغّل هذا السكربت. لا تعدّل الصفحات الإنجليزية يدويًا.
========================================================= */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const FRONTEND = path.join(__dirname, "..", "frontend");
const SITE = "https://www.hijazi-apartments.com";

const PAGES = [
    {
        ar: "about.html",
        en: "about-en.html",
        mode: "attrs",
        title: "About Us | HIJAZI Apartments – Furnished Apartments in Shmeisani, Amman",
        description: "About HIJAZI Apartments (شقق حجازي المفروشة) in Shmeisani, next to Abdali, Amman: 8 furnished 220 m² three-bedroom apartments for 7–8 guests, with free regular housekeeping, a dedicated parking space for each apartment and a 9.9 rating on Booking.com, for families, business travellers, medical and monthly stays.",
        keywords: "HIJAZI Apartments, furnished apartments Amman, furnished apartments Shmeisani, apartments near Abdali, apartments near Jordan Hospital, monthly furnished apartments Amman",
        ogTitle: "About Us | HIJAZI Apartments",
        ogDescription: "Furnished 220 m² three-bedroom apartments in Shmeisani, next to Abdali, Amman, with free regular housekeeping and a 9.9 rating on Booking.com.",
        schema: aboutSchema
    },
    {
        ar: "faq.html",
        en: "faq-en.html",
        mode: "faq",
        title: "Frequently Asked Questions | HIJAZI Apartments Amman",
        description: "Answers to common questions about HIJAZI Apartments in Shmeisani, Amman: booking, minimum stay, monthly discounts, parking, housekeeping, internet, heating and cooling, and the family policy.",
        ogTitle: "Frequently Asked Questions | HIJAZI Apartments",
        ogDescription: "Answers about booking, long stays and the location of HIJAZI Apartments in Shmeisani, Amman."
    },
    {
        ar: "reviews.html",
        en: "reviews-en.html",
        mode: "attrs",
        title: "Guest Reviews | HIJAZI Apartments",
        description: "Real guest reviews of HIJAZI Apartments on Booking.com and Airbnb, from Saudi Arabia, the UAE, Iraq, the UK, Germany and the United States, and our 9.9 “Exceptional” rating on Booking.com, for our furnished apartments in Shmeisani, Amman.",
        ogTitle: "Guest Reviews | HIJAZI Apartments",
        ogDescription: "Read what guests wrote about HIJAZI Apartments on Booking.com and Airbnb, and their stays in Shmeisani, Amman.",
        replace: [
            ['aria-label="صورة التقييم"', 'aria-label="Review screenshot"'],
            ['aria-label="إغلاق"', 'aria-label="Close"']
        ]
    }
];

/* الروابط الثابتة أسفل الصفحة الإنجليزية (يستبدلها main.js بالفوتر المشترك) */
function englishFooter(arFile) {
    const links = [
        ["/", "Home"], ["apartments.html", "Apartments"], ["booking.html", "Booking"],
        ["amenities-en.html", "Amenities &amp; services"], ["apartments-amman-en.html", "Furnished apartments in Shmeisani"],
        ["apartments-abdali-en.html", "Near Abdali"], ["apartments-jordan-hospital-en.html", "Near Jordan Hospital"],
        ["apartments-specialty-hospital-en.html", "Near the Specialty Hospital"], ["apartments-islamic-hospital-en.html", "Near the Islamic Hospital"],
        ["apartments-medical-amman-en.html", "Medical stays"], ["apartments-monthly-amman-en.html", "Monthly rentals"],
        ["faq-en.html", "FAQ"], ["reviews-en.html", "Reviews"], ["about-en.html", "About us"], [arFile, "العربية"]
    ];
    return '<div id="sharedFooter"><nav class="static-site-links" aria-label="Site links" style="display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;padding:24px 16px;font-size:14px">' +
        links.map(([href, text]) => `<a href="${href}">${text}</a>`).join("") + "</nav></div>";
}

const escAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escText = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function replaceOnce(html, pattern, replacement, what) {
    let count = 0;
    const out = html.replace(pattern, (...m) => { count++; return typeof replacement === "function" ? replacement(...m) : replacement; });
    if (count !== 1) throw new Error(`${what}: expected 1 match, found ${count}`);
    return out;
}

/* ---------- الرأس ---------- */
function convertHead(html, page) {
    const enUrl = `${SITE}/${page.en}`;
    html = replaceOnce(html, /<html lang="ar" dir="rtl">/, '<html lang="en" dir="ltr">', "html tag");
    html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escText(page.title)}</title>`, "title");
    html = replaceOnce(html, /<meta name="description"\s+content="[^"]*">/, `<meta name="description" content="${escAttr(page.description)}">`, "description");
    if (page.keywords) html = replaceOnce(html, /<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${escAttr(page.keywords)}">`, "keywords");
    html = replaceOnce(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${enUrl}">`, "canonical");
    html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escAttr(page.ogTitle)}">`, "og:title");
    html = replaceOnce(html, /<meta property="og:description"\s+content="[^"]*">/, `<meta property="og:description" content="${escAttr(page.ogDescription)}">`, "og:description");
    html = replaceOnce(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${enUrl}">`, "og:url");
    html = replaceOnce(html, /<meta property="og:locale" content="ar_JO">/,
        '<meta property="og:locale" content="en_US">\n    <meta property="og:locale:alternate" content="ar_JO">', "og:locale");
    return html;
}

function replaceJsonLd(html, transform) {
    return html.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n\s*<\/script>)/g, (m, open, body, close) => {
        return open + JSON.stringify(transform(JSON.parse(body)), null, 2) + close;
    });
}

/* ---------- نص الصفحة (about / reviews) ---------- */
function findClose(html, tag, from) {
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    re.lastIndex = from;
    let depth = 1, m;
    while ((m = re.exec(html))) {
        depth += m[1] ? -1 : 1;
        if (depth === 0) return m.index;
    }
    throw new Error(`no closing </${tag}>`);
}

function swapAttributes(html) {
    // src/alt/aria-label/href الإنجليزية داخل نفس الوسم
    return html.replace(/<[a-zA-Z][^<>]*\sdata-(?:src|alt|aria|href)-en="[^"]*"[^<>]*>/g, tag => {
        const pairs = { src: "data-src-en", alt: "data-alt-en", "aria-label": "data-aria-en", href: "data-href-en" };
        for (const [attr, source] of Object.entries(pairs)) {
            const m = tag.match(new RegExp(`\\s${source}="([^"]*)"`));
            if (!m) continue;
            tag = tag.replace(m[0], "");
            const current = new RegExp(`(\\s${attr}=")[^"]*(")`);
            tag = current.test(tag) ? tag.replace(current, `$1${m[1]}$2`) : tag.replace(/^<([a-zA-Z0-9]+)/, `<$1 ${attr}="${m[1]}"`);
        }
        return tag;
    });
}

function swapText(html) {
    const re = /<([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*?)?\sdata-en="([^"]*)"([^<>]*)>/g;
    let out = "", last = 0, m;
    while ((m = re.exec(html))) {
        const tag = m[1];
        const openEnd = re.lastIndex;
        const close = findClose(html, tag, openEnd);
        let attrs = (m[2] || "") + m[4];
        const en = m[3];
        if (/\bclass="[^"]*\brv-note\b/.test(attrs)) {
            // ملاحظة الترجمة في التقييمات: تظهر فقط إذا لها نص إنجليزي
            attrs = attrs.replace(/\shidden\b/, "");
            if (!en) attrs += " hidden";
        }
        out += html.slice(last, m.index) + `<${tag}${attrs}>${en}</${tag}>`;
        last = close + `</${tag}>`.length;
        re.lastIndex = last;
    }
    return out + html.slice(last);
}

/* ---------- الأسئلة الشائعة ---------- */
function faqData(html) {
    const m = html.match(/const faqData = (\{[\s\S]*?\n        \});/);
    if (!m) throw new Error("faqData not found in faq.html");
    return vm.runInNewContext(`(${m[1]})`);
}

function convertFaq(html) {
    const data = faqData(html);
    html = replaceOnce(html, /<h1 id="faqTitle">[^<]*<\/h1>/, '<h1 id="faqTitle">Frequently Asked Questions</h1>', "faqTitle");
    html = replaceOnce(html, /<p id="faqSubtitle">[^<]*<\/p>/, '<p id="faqSubtitle">The most common questions our guests ask before booking</p>', "faqSubtitle");

    const open = '<div id="faqContainer">';
    const start = html.indexOf(open);
    if (start === -1) throw new Error("faqContainer not found");
    const close = findClose(html, "div", start + open.length);
    const items = data.en.map(([q, a]) => `
            <div class="faq-item">
                <button class="faq-question" type="button">
                    <span>${escText(q)}</span>
                    <span>+</span>
                </button>
                <div class="faq-answer">${escText(a)}</div>
            </div>`).join("");
    html = html.slice(0, start + open.length) + items + "\n        " + html.slice(close);

    return replaceJsonLd(html, json => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": "en",
        "mainEntity": data.en.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } }))
    }));
}

/* ---------- البيانات المنظمة لصفحة من نحن ---------- */
function aboutSchema(json, page) {
    const enUrl = `${SITE}/${page.en}`;
    for (const node of json["@graph"] || []) {
        if (node["@type"] === "AboutPage") {
            node["@id"] = `${enUrl}#page`;
            node.url = enUrl;
            node.name = page.ogTitle;
            node.description = page.description;
            node.inLanguage = "en";
        } else if (node["@type"] === "LodgingBusiness") {
            node.description = "Furnished 220 m² three-bedroom apartments in Shmeisani, next to Abdali, Amman, for families, business travellers, medical and monthly stays.";
            node.address = Object.assign({}, node.address, { streetAddress: "Shmeisani", addressLocality: "Amman" });
        } else if (node["@type"] === "BreadcrumbList") {
            node.itemListElement = [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
                { "@type": "ListItem", "position": 2, "name": "About us", "item": enUrl }
            ];
        }
    }
    return json;
}

/* ---------- الصفحة كاملة ---------- */
function convert(page, arHtml) {
    let html = arHtml;
    html = convertHead(html, page);
    if (page.mode === "faq") {
        html = convertFaq(html);
    } else {
        if (page.schema) html = replaceJsonLd(html, json => page.schema(json, page));
        html = swapAttributes(html);
        html = swapText(html);
    }
    for (const [from, to] of page.replace || []) html = replaceOnce(html, from, to, from);
    html = replaceOnce(html, /<div id="sharedFooter">[\s\S]*?<\/nav><\/div>/, englishFooter(page.ar), "footer");
    html = replaceOnce(html,
        /window\.HIJAZI_PAGE_LANG = "ar";\n(\s*)window\.HIJAZI_ALT_PAGES = (\{[^}]*\});\n(\s*)try \{ localStorage\.setItem\("siteLang", "ar"\); \} catch \(e\) \{ \}/,
        (m, i1, alt, i2) => `window.HIJAZI_PAGE_LANG = "en";\n${i1}window.HIJAZI_ALT_PAGES = ${alt};\n${i2}try { localStorage.setItem("siteLang", "en"); } catch (e) { }`,
        "page language");
    return html;
}

function build({ check = false } = {}) {
    const stale = [];
    for (const page of PAGES) {
        const raw = fs.readFileSync(path.join(FRONTEND, page.ar), "utf8");
        const crlf = raw.includes("\r\n");
        const html = convert(page, raw.replace(/\r\n/g, "\n"));
        const target = path.join(FRONTEND, page.en);
        const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n") : null;
        if (current === html) continue;
        stale.push(page.en);
        if (!check) fs.writeFileSync(target, crlf ? html.replace(/\n/g, "\r\n") : html);
    }
    return stale;
}

module.exports = { build, PAGES };

if (require.main === module) {
    const check = process.argv.includes("--check");
    const stale = build({ check });
    if (check && stale.length) {
        console.error("Not in sync (run node scripts/build-en-pages.js): " + stale.join(", "));
        process.exitCode = 1;
    } else {
        console.log(stale.length ? (check ? "" : "Updated: " + stale.join(", ")) : "All English pages are in sync.");
    }
}
