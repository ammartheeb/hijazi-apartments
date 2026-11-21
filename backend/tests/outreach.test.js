const test = require("node:test");
const assert = require("node:assert/strict");
const contacts = require("../outreach/contacts.json");
const {
    isOutreachSendTime,
    dailyLimit,
    validateContacts,
    planSends,
    unsubscribeToken,
    verifyUnsubscribeToken,
    buildOutreachEmail
} = require("../services/outreach");
const { createOutreachRunner, BREVO_URL } = require("../services/outreach-runner");

const contact = (email, extra = {}) => ({ org: email, email, type: "ngo", lang: "en", source: "https://x.org", ...extra });

test("contacts file is valid: real emails, no duplicates, a source for each", () => {
    assert.deepEqual(validateContacts(contacts), []);
    assert.ok(contacts.length >= 20);
});

test("sends only Monday to Thursday, 9:00 to 13:59 Amman time", () => {
    assert.equal(isOutreachSendTime(new Date("2026-11-23T06:00:00Z")), true); // Mon 09:00
    assert.equal(isOutreachSendTime(new Date("2026-11-23T05:59:00Z")), false);
    assert.equal(isOutreachSendTime(new Date("2026-11-26T10:59:00Z")), true); // Thu 13:59
    assert.equal(isOutreachSendTime(new Date("2026-11-26T11:00:00Z")), false);
    assert.equal(isOutreachSendTime(new Date("2026-11-27T07:00:00Z")), false); // Fri
    assert.equal(isOutreachSendTime(new Date("2026-11-22T07:00:00Z")), false); // Sun
});

test("daily volume ramps up slowly", () => {
    assert.equal(dailyLimit(0), 10);
    assert.equal(dailyLimit(49), 10);
    assert.equal(dailyLimit(50), 15);
    assert.equal(dailyLimit(125), 25);
});

test("plan: follow-ups after 7 days first, then new contacts, within the daily room", () => {
    const now = new Date("2026-12-01T07:00:00Z");
    const list = [contact("a@x.org"), contact("b@x.org"), contact("c@x.org"), contact("d@x.org", { skip: true }), contact("e@x.org")];
    const records = [
        { email: "a@x.org", status: "sent", firstSentAt: new Date("2026-11-20T07:00:00Z"), followupSentAt: null },
        { email: "b@x.org", status: "sent", firstSentAt: new Date("2026-11-28T07:00:00Z"), followupSentAt: null },
        { email: "c@x.org", status: "stopped" }
    ];
    const plan = planSends({ contacts: list, records, now, sentToday: 8, totalSent: 0 });
    assert.deepEqual(plan.map(p => [p.contact.email, p.kind]), [["a@x.org", "followup"], ["e@x.org", "first"]]);
    assert.deepEqual(planSends({ contacts: list, records, now, sentToday: 10, totalSent: 0 }), []);
});

test("unsubscribe token is tied to the email and the secret", () => {
    const token = unsubscribeToken("A@x.org", "s1");
    assert.equal(verifyUnsubscribeToken("a@x.org", token, "s1"), true);
    assert.equal(verifyUnsubscribeToken("b@x.org", token, "s1"), false);
    assert.equal(verifyUnsubscribeToken("a@x.org", token, "s2"), false);
    assert.equal(verifyUnsubscribeToken("a@x.org", "", "s1"), false);
});

test("email text has the three monthly prices, invoice line, opt-out link, and no unpublished claims", () => {
    for (const lang of ["en", "ar"]) {
        for (const kind of ["first", "followup"]) {
            const { subject, text, html } = buildOutreachEmail(contact("a@x.org", { lang, type: "embassy", org: "Org <b>" }), kind, "https://api.example/u?t=1");
            assert.ok(subject.length > 10);
            for (const price of ["3,250", "2,500", "2,000"]) assert.ok(text.includes(price), `${lang} ${kind} ${price}`);
            assert.ok(text.includes("https://api.example/u?t=1"));
            assert.ok(text.includes("+962 78 900 0444"));
            assert.ok(!html.includes("<b>"), "org name is escaped");
            assert.doesNotMatch(text, /netflix|youtube|families only|electricity|كهرباء/i);
        }
    }
});

function fakeRecordModel() {
    const rows = new Map();
    const match = (row, query) => Object.entries(query).every(([key, value]) => {
        if (key === "$or") return value.some(q => match(row, q));
        if (value && typeof value === "object" && !(value instanceof Date)) {
            if ("$gte" in value) return row[key] && row[key] >= value.$gte;
            if ("$ne" in value) return row[key] !== value.$ne && row[key] !== undefined;
        }
        return (row[key] ?? null) === value;
    });
    return {
        rows,
        find: () => ({ lean: async () => [...rows.values()] }),
        countDocuments: async query => [...rows.values()].filter(row => match(row, query)).length,
        create: async doc => {
            if (rows.has(doc.email)) throw Object.assign(new Error("dup"), { code: 11000 });
            rows.set(doc.email, { firstSentAt: null, followupSentAt: null, messageIds: [], ...doc });
        },
        updateOne: async (query, update, options = {}) => {
            let row = [...rows.values()].find(r => match(r, query));
            if (!row && options.upsert) {
                row = { email: query.email, firstSentAt: null, followupSentAt: null, messageIds: [], ...update.$setOnInsert };
                rows.set(query.email, row);
            }
            if (!row) return { modifiedCount: 0 };
            Object.assign(row, update.$set || {});
            if (update.$push) row.messageIds.push(update.$push.messageIds);
            return { modifiedCount: 1 };
        },
        deleteOne: async query => {
            const row = [...rows.values()].find(r => match(r, query));
            if (row) rows.delete(row.email);
        }
    };
}

test("runner sends through Brevo with unsubscribe headers, records state, and stops on auth errors", async () => {
    const Record = fakeRecordModel();
    const calls = [];
    let fail = false;
    const runner = createOutreachRunner({
        Record,
        contacts: [contact("a@x.org"), contact("b@x.org"), contact("c@x.org")],
        env: { BREVO_API_KEY: "k" },
        pause: async () => {},
        log: () => {},
        fetchImpl: async (url, init) => {
            calls.push({ url, body: JSON.parse(init.body), key: init.headers["api-key"] });
            if (fail) return { ok: false, status: 401, json: async () => ({ message: "Key not found" }) };
            return { ok: true, status: 201, json: async () => ({ messageId: `<m${calls.length}>` }) };
        }
    });
    const monday = new Date("2026-11-23T07:00:00Z");

    const first = await runner.run(monday);
    assert.equal(first.sent.length, 3);
    assert.equal(calls[0].url, BREVO_URL);
    assert.equal(calls[0].key, "k");
    assert.equal(calls[0].body.sender.email, "info@hijazi-apartments.com");
    assert.match(calls[0].body.headers["List-Unsubscribe"], /^<https:\/\/api\.hijazi-apartments\.com\/outreach\/unsubscribe\?e=a%40x\.org&t=/);
    assert.equal(Record.rows.get("a@x.org").status, "sent");

    assert.equal((await runner.run(monday)).sent.length, 0, "nothing left for today");

    const url = new URL(calls[1].body.headers["List-Unsubscribe"].slice(1, -1));
    assert.equal(await runner.unsubscribe(url.searchParams.get("e"), url.searchParams.get("t")), true);
    assert.equal(await runner.unsubscribe("b@x.org", "wrong"), false);

    fail = true;
    const later = await runner.run(new Date("2026-12-01T07:00:00Z"));
    assert.equal(later.errors.length, 1, "stops after the first auth error");
    assert.equal(Record.rows.get("a@x.org").status, "sent", "released for a retry");
    assert.equal(Record.rows.get("b@x.org").status, "stopped");

    fail = false;
    const retry = await runner.run(new Date("2026-12-01T08:00:00Z"));
    assert.deepEqual(retry.sent.map(s => [s.contact.email, s.kind]), [["a@x.org", "followup"], ["c@x.org", "followup"]]);
});

test("runner does nothing without a Brevo key, when paused, or outside sending hours", async () => {
    const Record = fakeRecordModel();
    const make = env => createOutreachRunner({ Record, contacts: [contact("a@x.org")], env, fetchImpl: async () => { throw new Error("no"); }, log: () => {} });
    assert.equal(await make({}).run(new Date("2026-11-23T07:00:00Z")), null);
    assert.equal(await make({ BREVO_API_KEY: "k", OUTREACH_PAUSED: "true" }).run(new Date("2026-11-23T07:00:00Z")), null);
    assert.equal(await make({ BREVO_API_KEY: "k" }).run(new Date("2026-11-27T07:00:00Z")), null);
});
