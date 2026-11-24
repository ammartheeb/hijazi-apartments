/*
 * الناف بار الثابت: يكتب كود الشريط العلوي داخل كل صفحة عامة حتى يظهر مع أول عرض للصفحة،
 * بدل أن ينتظر تحميل main.js وتنفيذه. الكود نفسه يأتي من buildSharedHeaderHtml في main.js،
 * فلا يوجد نسختان مختلفتان من الشريط.
 *
 * يُستعمل من scripts/build-static-header.js (كل الصفحات) ومن scripts/build-en-pages.js
 * (الصفحات الإنجليزية المولّدة).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const MAIN_JS = path.join(__dirname, "..", "frontend", "js", "main.js");
const START = "<!-- HEADER:START -->";
const END = "<!-- HEADER:END -->";

let builder;

/* تحميل main.js في بيئة معزولة فيها document و window وهميان، لاستخراج الدالة فقط. */
function getBuilder() {
    if (builder) return builder;
    const noop = () => {};
    const fakeEl = new Proxy(function () {}, {
        get: (target, prop) => (prop === Symbol.toPrimitive ? () => "" : fakeEl),
        apply: () => fakeEl
    });
    const sandbox = {
        console,
        document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => fakeEl, documentElement: fakeEl, head: fakeEl, body: fakeEl },
        localStorage: { getItem: () => null, setItem: noop },
        navigator: { userAgent: "" },
        location: { pathname: "/", search: "", hash: "" },
        setTimeout, clearTimeout, requestAnimationFrame: noop
    };
    sandbox.window = sandbox;
    sandbox.window.addEventListener = noop;
    sandbox.window.matchMedia = () => ({ matches: false, addEventListener: noop });
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(MAIN_JS, "utf8"), sandbox, { filename: "main.js" });
    if (typeof sandbox.buildSharedHeaderHtml !== "function") {
        throw new Error("buildSharedHeaderHtml was not found in main.js");
    }
    builder = sandbox.buildSharedHeaderHtml;
    return builder;
}

/* يقرأ لغة الصفحة من <html lang> ومعاملات renderSharedHeader("page", bool) من سكربت الصفحة. */
function headerArgs(html) {
    const langMatch = html.match(/<html[^>]*\blang="(ar|en)"/);
    const callMatch = html.match(/renderSharedHeader\(\s*"([a-z-]+)"\s*,\s*(true|false)\s*\)/);
    if (!langMatch || !callMatch) return null;
    return { lang: langMatch[1], active: callMatch[1], adminTrigger: callMatch[2] === "true" };
}

/* يعيد الصفحة بعد كتابة الناف بار الثابت فيها، أو كما هي إن لم تكن فيها نقطة الناف بار. */
function applyStaticHeader(html) {
    const args = headerArgs(html);
    if (!args) return html;
    const inner = getBuilder()(args.lang, args.active, args.adminTrigger).trim();
    const block = `<div id="sharedHeader" data-static-lang="${args.lang}" data-static-active="${args.active}">${START}\n        ${inner}\n        ${END}</div>`;
    const existing = new RegExp(`<div id="sharedHeader"[^>]*>${START}[\\s\\S]*?${END}</div>`);
    if (existing.test(html)) return html.replace(existing, () => block);
    if (html.includes('<div id="sharedHeader"></div>')) return html.replace('<div id="sharedHeader"></div>', () => block);
    return html;
}

module.exports = { applyStaticHeader, headerArgs };
