/*
 * يكتب الناف بار الثابت في كل الصفحات العامة (انظر scripts/static-header.js).
 * التشغيل بعد أي تعديل على الناف بار في main.js:   node scripts/build-static-header.js
 * فحص فقط (يفشل إن كانت صفحة غير متزامنة):      node scripts/build-static-header.js --check
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { applyStaticHeader } = require("./static-header");

const FRONTEND = path.join(__dirname, "..", "frontend");
function run({ check = false } = {}) {
    const stale = [];
    for (const file of fs.readdirSync(FRONTEND).filter(f => f.endsWith(".html") && f !== "admin.html").sort()) {
        const full = path.join(FRONTEND, file);
        const raw = fs.readFileSync(full, "utf8");
        const crlf = raw.includes("\r\n"); // نسخة ويندوز: نقارن ونكتب بنفس نهايات الأسطر
        const html = raw.replace(/\r\n/g, "\n");
        const next = applyStaticHeader(html);
        if (next === html) continue;
        stale.push(file);
        if (!check) fs.writeFileSync(full, crlf ? next.replace(/\n/g, "\r\n") : next);
    }
    return stale;
}

if (require.main === module) {
    const check = process.argv.includes("--check");
    const stale = run({ check });
    if (check && stale.length) {
        console.error("Static header out of date in: " + stale.join(", "));
        process.exit(1);
    }
    console.log(stale.length ? (check ? "" : "Updated: " + stale.join(", ")) : "All headers are in sync.");
}

module.exports = { run };
