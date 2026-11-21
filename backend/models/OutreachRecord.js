const mongoose = require("mongoose");

/* حالة مراسلة كل جهة. القائمة نفسها بملف outreach/contacts.json، وهون بس شو انبعت ومين طلب يوقف. */
const outreachRecordSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200 },
        org: { type: String, default: "", trim: true, maxlength: 200 },
        status: {
            type: String,
            enum: ["sending", "sent", "followup_sending", "followed_up", "stopped"],
            required: true,
            index: true
        },
        firstSentAt: { type: Date, default: null, index: true },
        followupSentAt: { type: Date, default: null, index: true },
        stoppedAt: { type: Date, default: null },
        stopReason: { type: String, default: "", maxlength: 100 },
        messageIds: { type: [String], default: [] }
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("OutreachRecord", outreachRecordSchema);
