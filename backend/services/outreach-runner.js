const {
    REPLY_EMAIL,
    ammanDayStart,
    isOutreachSendTime,
    normalizeEmail,
    planSends,
    unsubscribeUrl,
    verifyUnsubscribeToken,
    buildOutreachEmail
} = require("./outreach");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/* تشغيل المراسلة: يقرأ الحالة من MongoDB، يبعث عن طريق Brevo، ويبعث للمالك ملخص اليوم. */
function createOutreachRunner({
    Record,
    contacts,
    env = process.env,
    fetchImpl = globalThis.fetch,
    isDbReady = () => true,
    notifyOwner = async () => {},
    pause = ms => new Promise(resolve => setTimeout(resolve, ms)),
    log = console.log
}) {
    let running = false;
    const apiKey = () => String(env.BREVO_API_KEY || "").trim();
    const secret = () => String(env.OUTREACH_SECRET || env.BREVO_API_KEY || "");
    const apiBase = () => String(env.PUBLIC_API_URL || "https://api.hijazi-apartments.com");
    const fromEmail = () => String(env.OUTREACH_FROM || REPLY_EMAIL);

    function enabled() {
        return Boolean(apiKey()) && String(env.OUTREACH_PAUSED || "").toLowerCase() !== "true";
    }

    async function sendOne(contact, kind) {
        const optOut = unsubscribeUrl(apiBase(), contact.email, secret());
        const message = buildOutreachEmail(contact, kind, optOut);
        const response = await fetchImpl(BREVO_URL, {
            method: "POST",
            headers: {
                "api-key": apiKey(),
                "content-type": "application/json",
                accept: "application/json"
            },
            body: JSON.stringify({
                sender: { name: "HIJAZI Apartments", email: fromEmail() },
                to: [{ email: normalizeEmail(contact.email), name: contact.org }],
                replyTo: { email: REPLY_EMAIL, name: "HIJAZI Apartments" },
                subject: message.subject,
                htmlContent: message.html,
                textContent: message.text,
                headers: {
                    "List-Unsubscribe": `<${optOut}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
                },
                tags: ["outreach", kind]
            })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(`Brevo ${response.status}: ${String(body.message || body.code || "").slice(0, 200)}`);
            error.status = response.status;
            throw error;
        }
        return String(body.messageId || "");
    }

    async function claim(contact, kind) {
        const email = normalizeEmail(contact.email);
        if (kind === "first") {
            try {
                await Record.create({ email, org: contact.org, status: "sending" });
                return true;
            } catch (error) {
                if (error.code === 11000) return false;
                throw error;
            }
        }
        const update = await Record.updateOne(
            { email, status: "sent", followupSentAt: null },
            { $set: { status: "followup_sending" } }
        );
        return update.modifiedCount === 1;
    }

    async function release(contact, kind) {
        const email = normalizeEmail(contact.email);
        if (kind === "first") {
            await Record.deleteOne({ email, status: "sending" });
        } else {
            await Record.updateOne({ email, status: "followup_sending" }, { $set: { status: "sent" } });
        }
    }

    async function complete(contact, kind, messageId, at) {
        const email = normalizeEmail(contact.email);
        const update = kind === "first"
            ? { status: "sent", firstSentAt: at }
            : { status: "followed_up", followupSentAt: at };
        await Record.updateOne(
            { email, status: kind === "first" ? "sending" : "followup_sending" },
            { $set: update, $push: { messageIds: messageId } }
        );
    }

    async function run(now = new Date()) {
        if (running || !enabled() || !isDbReady() || !isOutreachSendTime(now)) return null;
        running = true;
        const sent = [];
        const errors = [];

        try {
            const dayStart = ammanDayStart(now);
            const [records, sentToday, totalSent] = await Promise.all([
                Record.find({}, { email: 1, status: 1, firstSentAt: 1, followupSentAt: 1 }).lean(),
                Record.countDocuments({ $or: [{ firstSentAt: { $gte: dayStart } }, { followupSentAt: { $gte: dayStart } }] }),
                Promise.all([
                    Record.countDocuments({ firstSentAt: { $ne: null } }),
                    Record.countDocuments({ followupSentAt: { $ne: null } })
                ]).then(([a, b]) => a + b)
            ]);

            const plan = planSends({ contacts, records, now, sentToday, totalSent });

            for (const [index, item] of plan.entries()) {
                if (index > 0) await pause(8000 + Math.floor(Math.random() * 12000));
                if (!(await claim(item.contact, item.kind))) continue;
                try {
                    const messageId = await sendOne(item.contact, item.kind);
                    await complete(item.contact, item.kind, messageId, new Date());
                    sent.push(item);
                } catch (error) {
                    await release(item.contact, item.kind);
                    errors.push({ org: item.contact.org, message: error.message });
                    /* مفتاح غلط أو مرسل مش موثق أو حد الحساب: ما في فايدة نكمل اليوم. */
                    if ([400, 401, 402, 403, 429].includes(error.status)) break;
                }
            }

            if (sent.length || errors.length) {
                log(`OUTREACH sent=${sent.length} errors=${errors.length}`);
                await notifyOwner({ sent, errors }).catch(error =>
                    log("OUTREACH SUMMARY EMAIL ERROR:", error.message));
            }
            return { sent, errors };
        } finally {
            running = false;
        }
    }

    async function unsubscribe(email, token) {
        const clean = normalizeEmail(email);
        if (!clean || !secret() || !verifyUnsubscribeToken(clean, token, secret())) return false;
        const contact = contacts.find(item => normalizeEmail(item.email) === clean);
        await Record.updateOne(
            { email: clean },
            {
                $set: { status: "stopped", stoppedAt: new Date(), stopReason: "unsubscribe" },
                $setOnInsert: { org: contact?.org || "" }
            },
            { upsert: true }
        );
        return true;
    }

    return { run, unsubscribe, enabled };
}

module.exports = { createOutreachRunner, BREVO_URL };
