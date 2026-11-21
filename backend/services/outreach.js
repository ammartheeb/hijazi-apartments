const crypto = require("node:crypto");

/* =========================================================
   مراسلة الجهات (سفارات، منظمات دولية، منظمات حقوقية) لعروض الإقامة الطويلة.
   الإرسال عن طريق Brevo، مش Resend، عشان تأكيدات الحجز ما تتأثر بسمعة التسويق.
   كل الدوال هون بدون قاعدة بيانات أو شبكة، عشان تنفحص بالاختبارات.
========================================================= */

const DAY_MS = 24 * 60 * 60 * 1000;
const AMMAN_TIME_ZONE = "Asia/Amman";
const FOLLOWUP_AFTER_DAYS = 7;
const SITE_URL = "https://www.hijazi-apartments.com";
const MONTHLY_PAGE_EN = `${SITE_URL}/apartments-monthly-amman-en.html`;
const MONTHLY_PAGE_AR = `${SITE_URL}/apartments-monthly-amman.html`;
const PHONE = "+962 78 900 0444";
const REPLY_EMAIL = "info@hijazi-apartments.com";
const CONTACT_TYPES = new Set(["embassy", "un", "ngo", "rights"]);

function ammanParts(now) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: AMMAN_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        weekday: "short",
        hourCycle: "h23"
    }).formatToParts(now);
    return Object.fromEntries(parts.map(part => [part.type, part.value]));
}

function ammanDayStart(now = new Date()) {
    const p = ammanParts(now);
    return new Date(`${p.year}-${p.month}-${p.day}T00:00:00+03:00`);
}

/* الإثنين للخميس (أيام دوام مشتركة بين الأردن والسفارات الغربية)، 9 الصبح لـ 2 الظهر بتوقيت عمّان. */
function isOutreachSendTime(now = new Date()) {
    const p = ammanParts(now);
    const hour = Number(p.hour);
    return ["Mon", "Tue", "Wed", "Thu"].includes(p.weekday) && hour >= 9 && hour < 14;
}

/* زيادة تدريجية حسب مجموع اللي انبعت، عشان الدومين يبني سمعة. */
function dailyLimit(totalSent) {
    if (totalSent < 50) return 10;
    if (totalSent < 125) return 15;
    return 25;
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function validateContacts(contacts) {
    const errors = [];
    const seen = new Set();
    contacts.forEach((contact, index) => {
        const email = normalizeEmail(contact.email);
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) errors.push(`#${index} bad email`);
        if (seen.has(email)) errors.push(`#${index} duplicate ${email}`);
        seen.add(email);
        if (!contact.org) errors.push(`#${index} missing org`);
        if (!CONTACT_TYPES.has(contact.type)) errors.push(`#${index} bad type`);
        if (!["en", "ar"].includes(contact.lang)) errors.push(`#${index} bad lang`);
        if (!/^https?:\/\//.test(String(contact.source || ""))) errors.push(`#${index} missing source`);
    });
    return errors;
}

/* شو لازم ينبعت هلأ: المتابعات المستحقة أول، بعدين جهات جديدة بترتيب الملف. */
function planSends({ contacts, records, now = new Date(), sentToday, totalSent }) {
    const room = Math.max(0, dailyLimit(totalSent) - sentToday);
    if (!room) return [];

    const byEmail = new Map(records.map(record => [normalizeEmail(record.email), record]));
    const plan = [];

    for (const contact of contacts) {
        if (plan.length >= room) break;
        if (contact.skip) continue;
        const record = byEmail.get(normalizeEmail(contact.email));
        if (record?.status === "sent" && !record.followupSentAt && record.firstSentAt &&
            now.getTime() - new Date(record.firstSentAt).getTime() >= FOLLOWUP_AFTER_DAYS * DAY_MS) {
            plan.push({ contact, kind: "followup" });
        }
    }

    for (const contact of contacts) {
        if (plan.length >= room) break;
        if (contact.skip) continue;
        if (!byEmail.has(normalizeEmail(contact.email))) plan.push({ contact, kind: "first" });
    }

    return plan;
}

function unsubscribeToken(email, secret) {
    return crypto.createHmac("sha256", String(secret))
        .update(`outreach-unsubscribe:${normalizeEmail(email)}`)
        .digest("base64url")
        .slice(0, 32);
}

function verifyUnsubscribeToken(email, token, secret) {
    const expected = Buffer.from(unsubscribeToken(email, secret));
    const given = Buffer.from(String(token || ""));
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function unsubscribeUrl(apiBase, email, secret) {
    const params = new URLSearchParams({ e: normalizeEmail(email), t: unsubscribeToken(email, secret) });
    return `${apiBase.replace(/\/$/, "")}/outreach/unsubscribe?${params}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* الحقائق من amenities-data.js والأسعار الشهرية اللي أكدها المالك (2026-11-21). */
const COPY = {
    en: {
        subject: {
            embassy: "Furnished long-stay apartments in Shmeisani for embassy staff",
            un: "Furnished apartments in Amman for staff and mission teams",
            ngo: "Furnished apartments in Amman for staff and mission teams",
            rights: "Furnished apartments in Amman for visiting teams and delegations"
        },
        greeting: "Dear {org} team,",
        intro: {
            embassy: "We are writing to the Embassy's administration about housing for diplomats, staff on assignment and visiting delegations in Amman.",
            un: "We are writing about housing for international staff, consultants and mission teams on assignment in Jordan.",
            ngo: "We are writing about housing for international staff, consultants and mission teams on assignment in Jordan.",
            rights: "We are writing about housing for visiting researchers, delegations and teams working in Jordan."
        },
        facts: [
            "HIJAZI Apartments rents fully furnished apartments in Shmeisani, Amman, next to Abdali. We have 8 apartments of the same type in one building, so a whole team can stay together.",
            "Each apartment is 220 m² with 3 bedrooms (one master), 3 bathrooms, a living room, a guest room, an equipped kitchen and a laundry room, and sleeps up to 7–8 people. It has fiber internet, central heating, 5 air conditioners and a dedicated indoor parking space, with free housekeeping."
        ],
        ratesTitle: "Long-stay rates for the whole apartment:",
        rates: [
            "1 month: 3,250 JOD",
            "6-month booking: 2,500 JOD per month",
            "12-month booking: 2,000 JOD per month"
        ],
        invoice: "We issue official invoices.",
        closing: `Photos and details: ${MONTHLY_PAGE_EN}\nWe would be glad to arrange a viewing or send a formal quotation. Phone / WhatsApp: ${PHONE}`,
        signature: "Kind regards,\nHIJAZI Apartments\nYoussef Ben Tashfin St., Shmeisani, Amman, Jordan",
        followupSubject: "Follow-up: {subject}",
        followupBody: "A short follow-up on our message last week about furnished 3-bedroom apartments in Shmeisani, Amman, next to Abdali. If you have already replied, thank you, and please ignore this note.",
        optOut: "If you would rather not hear from us, use this link and we will not write again:"
    },
    ar: {
        subject: {
            embassy: "شقق مفروشة للإقامة الطويلة في الشميساني لموظفي السفارة",
            un: "شقق مفروشة في عمّان للموظفين وفرق المهمات",
            ngo: "شقق مفروشة في عمّان للموظفين وفرق المهمات",
            rights: "شقق مفروشة في عمّان للوفود والفرق الزائرة"
        },
        greeting: "السادة {org} المحترمين،",
        intro: {
            embassy: "تحية طيبة، نتواصل مع إدارة السفارة بخصوص سكن الدبلوماسيين والموظفين المنتدبين والوفود الزائرة في عمّان.",
            un: "تحية طيبة، نتواصل معكم بخصوص سكن الموظفين والخبراء وفرق المهمات العاملة في الأردن.",
            ngo: "تحية طيبة، نتواصل معكم بخصوص سكن الموظفين والخبراء وفرق المهمات العاملة في الأردن.",
            rights: "تحية طيبة، نتواصل معكم بخصوص سكن الباحثين والوفود والفرق الزائرة العاملة في الأردن."
        },
        facts: [
            "شقق حجازي المفروشة تؤجر شققًا مفروشة بالكامل في الشميساني بعمّان، بجانب العبدلي. لدينا 8 شقق من النوع نفسه في مبنى واحد، فيمكن للفريق أن يقيم معًا.",
            "مساحة كل شقة 220 م²، فيها 3 غرف نوم (إحداها ماستر)، و3 حمامات، وصالة، وغرفة ضيوف، ومطبخ مجهز، وغرفة غسيل، وتتسع لـ 7 إلى 8 أشخاص. وفيها إنترنت فايبر، وتدفئة مركزية، و5 مكيفات، وموقف سيارة داخلي خاص، مع خدمة تنظيف مجانية."
        ],
        ratesTitle: "أسعار الإقامة الطويلة للشقة كاملة:",
        rates: [
            "شهر واحد: 3,250 دينار",
            "حجز 6 أشهر: 2,500 دينار شهريًا",
            "حجز سنة: 2,000 دينار شهريًا"
        ],
        invoice: "نصدر فواتير رسمية.",
        closing: `الصور والتفاصيل: ${MONTHLY_PAGE_AR}\nيسعدنا ترتيب زيارة للشقة أو إرسال عرض سعر رسمي. هاتف / واتساب: ${PHONE}`,
        signature: "مع التحية،\nشقق حجازي المفروشة\nشارع يوسف بن تاشفين، الشميساني، عمّان، الأردن",
        followupSubject: "متابعة: {subject}",
        followupBody: "متابعة قصيرة لرسالتنا الأسبوع الماضي بخصوص الشقق المفروشة ذات الثلاث غرف نوم في الشميساني بجانب العبدلي. إذا كنتم قد رددتم، شكرًا لكم، ونرجو تجاهل هذه الرسالة.",
        optOut: "إذا كنتم لا ترغبون بمراسلات أخرى منا، استخدموا هذا الرابط ولن نراسلكم مجددًا:"
    }
};

function buildOutreachEmail(contact, kind, optOutUrl) {
    const copy = COPY[contact.lang] || COPY.en;
    const baseSubject = copy.subject[contact.type];
    const greeting = copy.greeting.replace("{org}", contact.org);
    const rates = copy.rates.map(line => `- ${line}`).join("\n");

    const blocks = kind === "followup"
        ? [greeting, copy.followupBody, `${copy.ratesTitle}\n${rates}`, copy.invoice, copy.closing, copy.signature, `${copy.optOut}\n${optOutUrl}`]
        : [greeting, copy.intro[contact.type], ...copy.facts, `${copy.ratesTitle}\n${rates}`, copy.invoice, copy.closing, copy.signature, `${copy.optOut}\n${optOutUrl}`];

    const subject = kind === "followup"
        ? copy.followupSubject.replace("{subject}", baseSubject)
        : baseSubject;
    const text = blocks.join("\n\n");
    const dir = contact.lang === "ar" ? "rtl" : "ltr";
    const html = `<div dir="${dir}" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222">` +
        blocks.map(block => `<p>${escapeHtml(block).replace(/\n/g, "<br>")
            .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`).join("") +
        "</div>";

    return { subject, text, html };
}

module.exports = {
    FOLLOWUP_AFTER_DAYS,
    REPLY_EMAIL,
    ammanDayStart,
    isOutreachSendTime,
    dailyLimit,
    normalizeEmail,
    validateContacts,
    planSends,
    unsubscribeToken,
    verifyUnsubscribeToken,
    unsubscribeUrl,
    buildOutreachEmail
};
