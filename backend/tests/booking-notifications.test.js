const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "";
process.env.RESEND_API_KEY = "";

const Booking = require("../models/Booking");
const {
    bookingText,
    bookingHtml,
    bookingSourceLabel,
    syncApartmentCalendar
} = require("../server");

function externalBooking(source = "booking") {
    return {
        apartmentId: 7,
        apartmentLabel: "شقة رقم 107",
        fullName: source === "airbnb" ? "حجز Airbnb" : "حجز Booking.com",
        email: "",
        phone: "",
        checkIn: new Date("2026-10-01T00:00:00.000Z"),
        checkOut: new Date("2026-10-05T00:00:00.000Z"),
        adults: 0,
        children: 0,
        currency: "JOD",
        totalPrice: 0,
        totalPriceText: "",
        notes: "Reserved",
        source,
        createdAt: new Date("2026-09-20T00:00:00.000Z")
    };
}

test("booking notification starts with حجز جديد and identifies its source", () => {
    const booking = externalBooking("booking");
    const text = bookingText(booking);
    const html = bookingHtml(booking, false);

    assert.match(text, /^حجز جديد - HIJAZI Apartments/);
    assert.match(text, /المصدر: Booking\.com/);
    assert.match(html, /وصل حجز جديد من Booking\.com/);
    assert.match(html, />المصدر<\/td>\s*<td[^>]*>Booking\.com</);
    assert.match(html, /حجز جديد · Booking\.com/);
    assert.equal(bookingSourceLabel("airbnb"), "Airbnb");
    assert.equal(bookingSourceLabel("website"), "الموقع");
});

test("iCal sync notifies only when an external booking is first inserted", async () => {
    const originalFindOneAndUpdate = Booking.findOneAndUpdate;
    const originalUpdateMany = Booking.updateMany;
    const notifications = [];
    let syncCount = 0;

    Booking.findOneAndUpdate = async (filter, update, options) => {
        assert.equal(options.includeResultMetadata, true);
        assert.equal(update.$set.fullName, undefined);
        assert.equal(update.$set.totalPrice, undefined);
        assert.equal(update.$set.notes, undefined);
        const inserted = syncCount++ === 0;

        return {
            lastErrorObject: {
                updatedExisting: !inserted,
                ...(inserted ? { upserted: "external-booking-id" } : {})
            },
            value: {
                ...externalBooking("airbnb"),
                ...update.$set,
                ...update.$setOnInsert,
                source: filter.source,
                externalUid: filter.externalUid
            }
        };
    };
    Booking.updateMany = async () => ({ acknowledged: true });

    const apartment = {
        apartmentId: 7,
        label: "شقة رقم 107",
        calendars: {
            airbnb: {
                enabled: true,
                url: "https://www.airbnb.com/calendar/example.ics"
            }
        },
        save: async () => apartment
    };

    const fetchEvents = async () => [{
        externalUid: "airbnb-event-1",
        checkIn: new Date("2026-10-01T00:00:00.000Z"),
        checkOut: new Date("2026-10-05T00:00:00.000Z"),
        sourceReference: "airbnb-event-1",
        summary: "Reserved",
        description: "Late arrival",
        location: "Shmeisani"
    }];

    try {
        await syncApartmentCalendar(apartment, "airbnb", {
            fetchEvents,
            notifyBooking: async booking => notifications.push(booking)
        });
        await syncApartmentCalendar(apartment, "airbnb", {
            fetchEvents,
            notifyBooking: async booking => notifications.push(booking)
        });

        assert.equal(notifications.length, 1);
        assert.equal(notifications[0].source, "airbnb");
        assert.equal(notifications[0].externalUid, "airbnb-event-1");
        assert.equal(notifications[0].externalDescription, "Late arrival");
        assert.equal(notifications[0].notes, "Late arrival");
    } finally {
        Booking.findOneAndUpdate = originalFindOneAndUpdate;
        Booking.updateMany = originalUpdateMany;
    }
});

test("guest booking email follows the booking language and escapes guest input", () => {
    const { guestBookingEmail } = require("../server");
    const base = {
        fullName: "<script>x</script>",
        apartmentId: 1,
        checkIn: new Date("2026-12-10T00:00:00Z"),
        checkOut: new Date("2026-12-14T00:00:00Z"),
        adults: 2,
        children: 0,
        totalPriceText: "480.00 دينار",
        notes: "<img src=x>"
    };
    const ar = guestBookingEmail({ ...base, apartmentLabel: "شقة 104" });
    assert.match(ar.subject, /تم استلام طلب حجزك/);
    assert.match(ar.html, /dir="rtl"/);
    assert.ok(!ar.html.includes("<script>") && !ar.html.includes("<img src=x>"));
    assert.ok(ar.html.includes("https://wa.me/962789000444"));
    assert.ok(ar.text.includes("480.00 دينار"));

    const en = guestBookingEmail({ ...base, apartmentLabel: "Apartment 104", checkOut: new Date("2027-01-20T00:00:00Z") });
    assert.match(en.subject, /We received your booking request/);
    assert.match(en.html, /dir="ltr"/);
    assert.match(en.text, /long-stay/);
    assert.match(en.text, /Nights: 41/);
});

test("owner email for a website booking has guest contact buttons and escapes input", () => {
    const html = bookingHtml({
        ...externalBooking("website"),
        fullName: "<b>Ali</b> Test",
        phone: "0791234567",
        email: "ali@example.com",
        adults: 2,
        totalPriceText: "480.00 دينار",
        notes: "<script>x</script>"
    }, false);
    assert.ok(html.includes("https://wa.me/962791234567?text="));
    assert.ok(html.includes("tel:0791234567"));
    assert.ok(html.includes("mailto:ali@example.com"));
    assert.ok(html.includes("بانتظار تأكيدك"));
    assert.ok(!html.includes("<b>Ali</b>") && !html.includes("<script>x"));
});

test("whatsapp numbers are normalized for Jordanian and international formats", () => {
    const { whatsappNumber } = require("../services/email-layout");
    assert.equal(whatsappNumber("0791234567"), "962791234567");
    assert.equal(whatsappNumber("+962 79 123 4567"), "962791234567");
    assert.equal(whatsappNumber("00966501234567"), "966501234567");
    assert.equal(whatsappNumber("123"), "");
});
