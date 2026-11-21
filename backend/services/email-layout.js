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

/* ألوان «زجاج» الموقع بنسخة تناسب الإيميل: برامج البريد لا تدعم التمويه (backdrop-filter)،
   فالزجاج هنا ألوان داكنة شبه شفافة بصريًا بإطار فاتح رفيع، مثل كروت الموقع. */
const GLASS = {
    page: "#14120f",
    card: "#1d1b17",
    panel: "#25221d",
    line: "#3b352a",
    rowLine: "#332f28",
    text: "#ffffff",
    soft: "#cfc6b3",
    muted: "#a1978a"
};

const BADGE_COLORS = {
    green: ["#183224", "#86efac", "#2f6b45"],
    gold: ["#33291a", "#f1c75b", "#6b5520"],
    red: ["#3a1c1a", "#ffa49c", "#7a2e28"],
    blue: ["#182638", "#9cc2ff", "#2c4a74"],
    rose: ["#3a1a22", "#ff9fb1", "#7a2c3d"]
};

function button({ href, label, tone = "gold" }) {
    if (!href) return "";
    const styles = {
        gold: `background-color:${GOLD};background-image:linear-gradient(135deg,#d4a017,#8a6508);color:#ffffff;border:1px solid #b8860b`,
        whatsapp: `background-color:${GOLD};background-image:linear-gradient(135deg,#d4a017,#8a6508);color:#ffffff;border:1px solid #b8860b`,
        glass: `background-color:#2a2620;color:#ffffff;border:1px solid #4a4234`,
        dark: `background-color:#2a2620;color:#f1c75b;border:1px solid #4a4234`,
        light: `background-color:#2a2620;color:#ffffff;border:1px solid #4a4234`
    };
    return `<a href="${esc(href)}" style="${FONT};display:inline-block;margin:4px;padding:12px 20px;border-radius:15px;${styles[tone] || styles.gold};font-size:14px;font-weight:bold;text-decoration:none">${esc(label)}</a>`;
}

/*
 * rows: [[label, value, { html: true } ]] — القيمة نص عادي إلا إذا html: true (مسؤولية المستدعي يهرّبها).
 * blocks: [{ title, text, tone }] مربعات ملاحظات.
 */
function ownerEmailHtml({ preheader = "", badge, badgeTone = "gold", title, intro = "", rows = [], blocks = [], buttons = [], footer = "" }) {
    const [badgeBg, badgeColor, badgeLine] = BADGE_COLORS[badgeTone] || BADGE_COLORS.gold;
    const rowsHtml = rows.filter(row => row && row[1] !== undefined && row[1] !== null && row[1] !== "").map(([label, value, options = {}], index) => `
                <tr>
                    <td style="${FONT};padding:11px 0;border-top:${index ? `1px solid ${GLASS.rowLine}` : "0"};color:${GLASS.muted};font-size:14px;width:34%;text-align:right;vertical-align:top">${esc(label)}</td>
                    <td style="${FONT};padding:11px 0;border-top:${index ? `1px solid ${GLASS.rowLine}` : "0"};color:${GLASS.text};font-size:15px;font-weight:bold;text-align:right">${options.html ? value : esc(value)}</td>
                </tr>`).join("");

    const blockTones = {
        note: `background-color:${GLASS.panel};border:1px solid ${GLASS.line};color:${GLASS.soft}`,
        gold: "background-color:#2e2614;border:1px solid #6b5520;color:#f3dfa6",
        red: "background-color:#3a1c1a;border:1px solid #7a2e28;color:#ffd0cb",
        green: "background-color:#183022;border:1px solid #2f6b45;color:#c9f2d6"
    };
    const blocksHtml = blocks.filter(Boolean).map(block => `
        <tr><td style="padding:0 26px 12px">
            <div style="${FONT};${blockTones[block.tone] || blockTones.note};border-radius:14px;padding:13px 16px;font-size:14px;line-height:1.75;text-align:right">
                ${block.title ? `<b style="display:block;margin-bottom:2px;color:#ffffff">${esc(block.title)}</b>` : ""}<span style="white-space:pre-line">${esc(block.text)}</span>
            </div>
        </td></tr>`).join("");

    const buttonsHtml = buttons.filter(item => item && item.href).map(button).join("\n            ");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background-color:${GLASS.page}">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader || intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${GLASS.page};padding:22px 10px">
<tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:600px;background-color:${GLASS.card};border-radius:22px;overflow:hidden;border:1px solid ${GLASS.line}">
        <tr><td style="padding:18px 26px;border-bottom:2px solid ${GOLD}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="${FONT};color:#f1c75b;font-size:20px;font-weight:bold;text-align:right">HIJAZI Apartments</td>
                <td style="${FONT};color:${GLASS.muted};font-size:13px;text-align:left">لوحة الإدارة</td>
            </tr></table>
        </td></tr>
        <tr><td style="padding:22px 26px 6px;text-align:right">
            <span style="${FONT};display:inline-block;background-color:${badgeBg};color:${badgeColor};border:1px solid ${badgeLine};border-radius:999px;padding:6px 14px;font-size:13px;font-weight:bold">${esc(badge)}</span>
            <h1 style="${FONT};margin:14px 0 6px;font-size:21px;line-height:1.5;color:${GLASS.text}">${esc(title)}</h1>
            ${intro ? `<p style="${FONT};margin:0;color:${GLASS.soft};font-size:15px;line-height:1.8">${esc(intro)}</p>` : ""}
        </td></tr>
        ${rowsHtml ? `<tr><td style="padding:14px 26px 12px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${GLASS.panel};border:1px solid ${GLASS.line};border-radius:16px;padding:2px 16px">${rowsHtml}
            </table>
        </td></tr>` : ""}${blocksHtml}
        ${buttonsHtml ? `<tr><td style="padding:6px 20px 20px;text-align:center">
            ${buttonsHtml}
        </td></tr>` : ""}
        <tr><td style="background-color:#171512;padding:14px 26px;text-align:center;border-top:1px solid ${GLASS.line}">
            <div style="${FONT};color:#8a8275;font-size:12px;line-height:1.7">${esc(footer || "رسالة تلقائية من نظام HIJAZI PMS، تصلك أنت فقط.")}</div>
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
    GLASS,
    button,
    esc,
    whatsappNumber,
    telHref,
    ownerEmailHtml,
    prettyArabicDate
};
