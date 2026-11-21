/* =========================================================
   قالب موحّد لإيميلات المالك (حجز جديد، تذكيرات، فشل مزامنة، ملخص المراسلة)
   بنفس ستايل إيميل الضيف: رأس أسود وذهبي، جداول وستايل داخلي عشان يظهر صح بجيميل والموبايل.
========================================================= */

const ADMIN_URL = "https://www.hijazi-apartments.com/admin.html";
const GOLD = "#c89116";
const FONT = "font-family:Tahoma,Arial,Helvetica,sans-serif";

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* رقم الهاتف لرابط واتساب: 07xxxxxxxx الأردني يصير 9627xxxxxxxx. */
function whatsappNumber(phone) {
    let digits = String(phone || "").replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) digits = digits.slice(1);
    else if (digits.startsWith("00")) digits = digits.slice(2);
    else if (/^07\d{8}$/.test(digits)) digits = `962${digits.slice(1)}`;
    digits = digits.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function telHref(phone) {
    const clean = String(phone || "").replace(/[^\d+]/g, "");
    return clean.replace(/\D/g, "").length >= 7 ? `tel:${clean}` : "";
}

const BADGE_COLORS = {
    green: ["#eaf7ee", "#1e7a3c"],
    gold: ["#fff5dc", "#8a6100"],
    red: ["#fdecec", "#b42318"],
    blue: ["#e8f0fb", "#003580"],
    rose: ["#ffeef0", "#c7253e"]
};

function button({ href, label, tone = "gold" }) {
    if (!href) return "";
    const styles = {
        whatsapp: "background:#25d366;color:#ffffff",
        gold: `background:${GOLD};color:#111111`,
        dark: "background:#111111;color:#f1c75b",
        light: "background:#f3efe6;color:#111111"
    };
    return `<a href="${esc(href)}" style="${FONT};display:inline-block;margin:4px;padding:11px 18px;border-radius:999px;${styles[tone] || styles.gold};font-size:14px;font-weight:bold;text-decoration:none">${esc(label)}</a>`;
}

/*
 * rows: [[label, value, { html: true } ]] — القيمة نص عادي إلا إذا html: true (مسؤولية المستدعي يهرّبها).
 * blocks: [{ title, text, tone }] مربعات ملاحظات.
 */
function ownerEmailHtml({ preheader = "", badge, badgeTone = "gold", title, intro = "", rows = [], blocks = [], buttons = [], footer = "" }) {
    const [badgeBg, badgeColor] = BADGE_COLORS[badgeTone] || BADGE_COLORS.gold;
    const rowsHtml = rows.filter(row => row && row[1] !== undefined && row[1] !== null && row[1] !== "").map(([label, value, options = {}], index) => `
                <tr>
                    <td style="${FONT};padding:11px 0;border-top:${index ? "1px solid #f0e6cf" : "0"};color:#7a7a7a;font-size:14px;width:34%;text-align:right;vertical-align:top">${esc(label)}</td>
                    <td style="${FONT};padding:11px 0;border-top:${index ? "1px solid #f0e6cf" : "0"};color:#1c1c1c;font-size:15px;font-weight:bold;text-align:right">${options.html ? value : esc(value)}</td>
                </tr>`).join("");

    const blockTones = {
        note: "background:#faf7f0;border:1px solid #eadfc6;color:#444",
        gold: "background:#fff7e3;border:1px solid #e9c46a;color:#6b4f00",
        red: "background:#fdecec;border:1px solid #f3a3a3;color:#8f1a10",
        green: "background:#eaf7ee;border:1px solid #abefc6;color:#1e5c34"
    };
    const blocksHtml = blocks.filter(Boolean).map(block => `
        <tr><td style="padding:0 26px 12px">
            <div style="${FONT};${blockTones[block.tone] || blockTones.note};border-radius:12px;padding:13px 16px;font-size:14px;line-height:1.75;text-align:right">
                ${block.title ? `<b style="display:block;margin-bottom:2px">${esc(block.title)}</b>` : ""}<span style="white-space:pre-line">${esc(block.text)}</span>
            </div>
        </td></tr>`).join("");

    const buttonsHtml = buttons.filter(item => item && item.href).map(button).join("\n            ");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3efe6">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader || intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;padding:22px 10px">
<tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eadfc6">
        <tr><td style="background:#111111;padding:18px 26px;border-bottom:4px solid ${GOLD}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="${FONT};color:${GOLD};font-size:20px;font-weight:bold;text-align:right">HIJAZI Apartments</td>
                <td style="${FONT};color:#bfb6a3;font-size:13px;text-align:left">لوحة الإدارة</td>
            </tr></table>
        </td></tr>
        <tr><td style="padding:22px 26px 6px;text-align:right">
            <span style="${FONT};display:inline-block;background:${badgeBg};color:${badgeColor};border-radius:999px;padding:6px 14px;font-size:13px;font-weight:bold">${esc(badge)}</span>
            <h1 style="${FONT};margin:14px 0 6px;font-size:21px;line-height:1.5;color:#1c1c1c">${esc(title)}</h1>
            ${intro ? `<p style="${FONT};margin:0;color:#4a4a4a;font-size:15px;line-height:1.8">${esc(intro)}</p>` : ""}
        </td></tr>
        ${rowsHtml ? `<tr><td style="padding:14px 26px 12px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e6cf;border-radius:12px;padding:2px 16px">${rowsHtml}
            </table>
        </td></tr>` : ""}${blocksHtml}
        ${buttonsHtml ? `<tr><td style="padding:6px 20px 20px;text-align:center">
            ${buttonsHtml}
        </td></tr>` : ""}
        <tr><td style="background:#faf7f0;padding:14px 26px;text-align:center;border-top:1px solid #eadfc6">
            <div style="${FONT};color:#8a8a8a;font-size:12px;line-height:1.7">${esc(footer || "رسالة تلقائية من نظام HIJAZI PMS، تصلك أنت فقط.")}</div>
        </td></tr>
    </table>
</td></tr>
</table>
</body>
</html>`;
}

/* تاريخ مقروء: «الخميس، 10 كانون الأول 2026» بأرقام لاتينية. */
function prettyArabicDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ar-JO-u-nu-latn", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    }).format(date);
}

module.exports = {
    ADMIN_URL,
    esc,
    whatsappNumber,
    telHref,
    ownerEmailHtml,
    prettyArabicDate
};
