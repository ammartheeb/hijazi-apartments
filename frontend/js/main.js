/* =========================================================
   ملف JavaScript الرئيسي للموقع
   يحتوي على:
   1) بيانات الشقق
   2) نظام الترجمة عربي / إنجليزي
   3) الهيدر المشترك
   4) الفوتر المشترك
   5) أدوات مساعدة عامة
========================================================= */

/* =========================
   أسعار تحويل العملة
========================= */
const rates = { USD: 1.41, SAR: 5.29 };
/* =========================
   أسعار الشقق بالدينار الأردني
========================= */
const APARTMENT_PRICES = {
    1: 150,
    2: 200,
    3: 150,
    4: 200,
    5: 150,
    6: 200,
    7: 150,
    8: 200
};

/* =========================
   أرقام الشقق الظاهرة للزائر

   تبقى المفاتيح 1-8 معرّفات داخلية للصور والروابط فقط،
   بينما تظهر الأرقام الفعلية التالية في جميع صفحات الموقع.
========================= */
const APARTMENT_DISPLAY_NUMBERS = Object.freeze({
    1: "104",
    2: "106",
    3: "204",
    4: "105",
    5: "207",
    6: "305",
    7: "107",
    8: "309"
});

/* ترتيب بطاقات الشقق وقوائم الاختيار الظاهر للزائر. */
const APARTMENT_DISPLAY_ORDER = Object.freeze([1, 2, 6, 3, 4, 5, 7, 8]);

function getApartmentDisplayNumber(apartmentId) {
    return APARTMENT_DISPLAY_NUMBERS[Number(apartmentId)] || String(apartmentId || "");
}

function getApartmentDisplayName(apartmentId, lang = "ar", fallback = "") {
    const displayNumber = APARTMENT_DISPLAY_NUMBERS[Number(apartmentId)];

    if (displayNumber) {
        return lang === "en"
            ? `Apartment ${displayNumber}`
            : `شقة ${displayNumber}`;
    }

    if (fallback) return String(fallback);

    return lang === "en"
        ? `Apartment ${apartmentId}`
        : `شقة ${apartmentId}`;
}
/* =========================
   بيانات الشقق المشتركة
========================= */
const HIJAZI_APARTMENTS = {
    1: {
        id: 1,
        location: "الشميساني",
        mapEmbed: "https://maps.google.com/maps?cid=2903136424075634115&z=17&output=embed",
        nameAr: getApartmentDisplayName(1, "ar"),
        nameEn: getApartmentDisplayName(1, "en"),
        price: APARTMENT_PRICES[1],
        oneBalcony: false,
        descAr: "شقة مفروشة راقية مناسبة للإقامة الطبية والتنفيذية في عمّان.",
        descEn: "Elegant furnished apartment suitable for medical and executive stays in Amman.",
        featuresAr: ["3 غرف نوم", "3 حمامات", "غرفة معيشة", "غرفة ضيوف", "مطبخ", "شرفتان", "واي فاي", "مكيف"],
        featuresEn: ["3 Bedrooms", "3 Bathrooms", "Living Room", "Guest Room", "Kitchen", "2 Balconies", "Wi-Fi", "Air Conditioning"],
        images: [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
        ],
        video: "https://www.w3schools.com/html/mov_bbb.mp4",
        rooms: [
            {
                key: "master",
                titleAr: "غرفة النوم الماستر",
                titleEn: "Master Bedroom",
                noteAr: "تحتوي على تخت مزدوج وحمام خاص.",
                noteEn: "Includes a double bed and a private bathroom.",
                images: [
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693431205-36e7f9307d05?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "bedroom1",
                titleAr: "غرفة نوم 1",
                titleEn: "Bedroom 1",
                noteAr: "تحتوي على سريرين مفردين.",
                noteEn: "Includes two single beds.",
                images: [
                    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "bedroom2",
                titleAr: "غرفة نوم 2",
                titleEn: "Bedroom 2",
                noteAr: "تحتوي على سريرين مفردين.",
                noteEn: "Includes two single beds.",
                images: [
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "living",
                titleAr: "غرفة المعيشة",
                titleEn: "Living Room",
                noteAr: "مساحة مريحة للجلوس اليومي.",
                noteEn: "Comfortable space for everyday living.",
                images: [
                    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693431205-36e7f9307d05?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "guest",
                titleAr: "غرفة الضيوف",
                titleEn: "Guest Room",
                noteAr: "غرفة مخصصة لاستقبال الضيوف براحة وأناقة.",
                noteEn: "Dedicated guest area with comfort and elegance.",
                images: [
                    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "kitchen",
                titleAr: "المطبخ",
                titleEn: "Kitchen",
                noteAr: "مطبخ مجهز بالكامل للاستخدام اليومي.",
                noteEn: "Fully equipped kitchen for daily use.",
                images: [
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "bathrooms",
                titleAr: "الحمامات",
                titleEn: "Bathrooms",
                noteAr: "3 حمامات في كل شقة.",
                noteEn: "3 bathrooms in each apartment.",
                images: [
                    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1505693431205-36e7f9307d05?auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                key: "balconies",
                titleAr: "الشرفات",
                titleEn: "Balconies",
                noteAr: "تحتوي الشقة على شرفتين.",
                noteEn: "This apartment includes two balconies.",
                images: [
                    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80"
                ]
            }
        ]
    }
};

/* =========================
   توليد بيانات باقي الشقق
   كل شقة مذكورة في APARTMENT_DISPLAY_NUMBERS تُنشأ تلقائيًا،
   فإضافة شقة جديدة لا تحتاج تعديل هذه الحلقة.
========================= */
Object.keys(APARTMENT_DISPLAY_NUMBERS).map(Number).forEach(i => {
    if (i === 1) return;

    HIJAZI_APARTMENTS[i] = JSON.parse(JSON.stringify(HIJAZI_APARTMENTS[1]));
    HIJAZI_APARTMENTS[i].id = i;
    HIJAZI_APARTMENTS[i].nameAr = getApartmentDisplayName(i, "ar");
    HIJAZI_APARTMENTS[i].nameEn = getApartmentDisplayName(i, "en");
    HIJAZI_APARTMENTS[i].price = APARTMENT_PRICES[i];
});


/* =========================================================
   جلب أسعار الشقق من HIJAZI PMS
   الأسعار الموجودة أعلى الملف تبقى احتياطية عند تعذر الاتصال
========================================================= */
const HIJAZI_PUBLIC_API_BASE =
    "https://api.hijazi-apartments.com";

async function loadApartmentPricesFromPms() {
    try {
        const response = await fetch(
            `${HIJAZI_PUBLIC_API_BASE}/apartments/public`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("تعذر جلب أسعار الشقق.");
        }

        const data = await response.json();

        for (const apartment of data.apartments || []) {
            const apartmentId =
                Number(apartment.apartmentId);

            const nightlyPriceJod =
                Number(apartment.nightlyPriceJod);

            if (
                HIJAZI_APARTMENTS[apartmentId] &&
                Number.isFinite(nightlyPriceJod) &&
                nightlyPriceJod >= 0
            ) {
                APARTMENT_PRICES[apartmentId] =
                    nightlyPriceJod;

                HIJAZI_APARTMENTS[apartmentId].price =
                    nightlyPriceJod;
            }
        }

        return true;
    } catch (error) {
        console.warn(
            "PMS PRICES FALLBACK:",
            error.message
        );

        return false;
    }
}

/* =========================================================
   موقع موحد لجميع الشقق - HIJAZI Apartments
========================================================= */
const HIJAZI_SHARED_LOCATION_AR = "HIJAZI Apartments - شارع يوسف بن تاشفين، الشميساني، عمّان";
/* المكان الرسمي على خرائط جوجل (أرسله المالك 2026-11-18): 31.9758601, 35.898315
   الخريطة المضمّنة تعرض بطاقة المكان نفسه (cid) مع زر "افتح في خرائط Google". */
const HIJAZI_MAP_URL = "https://maps.app.goo.gl/gfww6DooaC2uzFrt8";
const HIJAZI_SHARED_MAP_EMBED = "https://maps.google.com/maps?cid=2903136424075634115&z=17&output=embed";

Object.values(HIJAZI_APARTMENTS).forEach(apartment => {
    apartment.location = HIJAZI_SHARED_LOCATION_AR;
    apartment.mapEmbed = HIJAZI_SHARED_MAP_EMBED;
});
/* =========================================================
   نظام صور محلية مرتبة لكل شقة مثل Airbnb
   بدون أي صور خارجية من الإنترنت

   ملاحظة:
   أول صورة من أول قسم هي صورة البطاقة الرئيسية.
========================================================= */

const APARTMENT_ROOM_PHOTO_PLAN = [
    {
        key: "living",
        folder: "living",
        count: 4,
        titleAr: "غرفة المعيشة",
        titleEn: "Living Room",
        noteAr: "صور غرفة المعيشة والصالة.",
        noteEn: "Living room and seating area photos."
    },
    {
        key: "guest",
        folder: "guest",
        count: 2,
        titleAr: "غرفة الضيوف",
        titleEn: "Guest Room",
        noteAr: "صور غرفة الضيوف.",
        noteEn: "Guest room photos."
    },
    {
        key: "bedroom-1",
        folder: "bedroom-1",
        count: 3,
        titleAr: "غرفة النوم الماستر",
        titleEn: "Master Bedroom",
        noteAr: "صور غرفة النوم الماستر.",
        noteEn: "Master bedroom photos."
    },
    {
        key: "bedroom-2",
        folder: "bedroom-2",
        count: 2,
        titleAr: "غرفة النوم 2",
        titleEn: "Bedroom 2",
        noteAr: "صور غرفة النوم الثانية.",
        noteEn: "Bedroom 2 photos."
    },
    {
        key: "bedroom-3",
        folder: "bedroom-3",
        count: 2,
        titleAr: "غرفة النوم 3",
        titleEn: "Bedroom 3",
        noteAr: "صور غرفة النوم الثالثة.",
        noteEn: "Bedroom 3 photos."
    },
    {
        key: "kitchen",
        folder: "kitchen",
        count: 3,
        titleAr: "المطبخ",
        titleEn: "Kitchen",
        noteAr: "صور المطبخ وتجهيزاته.",
        noteEn: "Kitchen photos."
    },
    {
        key: "bathroom-1",
        folder: "bathroom-1",
        count: 2,
        titleAr: "حمام الماستر",
        titleEn: "Master Bathroom",
        noteAr: "صور حمام غرفة النوم الماستر.",
        noteEn: "Master bathroom photos."
    },
    {
        key: "bathroom-2",
        folder: "bathroom-2",
        count: 2,
        titleAr: "حمام كامل 2",
        titleEn: "Bathroom 2",
        noteAr: "صور الحمام الثاني.",
        noteEn: "Bathroom 2 photos."
    },
    {
        key: "bathroom-3",
        folder: "bathroom-3",
        count: 2,
        titleAr: "حمام كامل 3",
        titleEn: "Bathroom 3",
        noteAr: "صور الحمام الثالث.",
        noteEn: "Bathroom 3 photos."
    },
    {
        key: "laundry",
        folder: "laundry",
        count: 2,
        titleAr: "غرفة الغسيل",
        titleEn: "Laundry Room",
        noteAr: "صور غرفة الغسيل أو مساحة الخدمات.",
        noteEn: "Laundry or service area photos."
    },
    {
        key: "others",
        folder: "others",
        count: 4,
        titleAr: "المدخل والمبنى",
        titleEn: "Entrance & building",
        noteAr: "صور عامة مثل الباب، المدخل، الممر، الدرج، المصعد، وأي تفاصيل إضافية.",
        noteEn: "General photos such as door, entrance, corridor, stairs, elevator, and extra details."
    },
    {
        key: "balcony",
        folder: "balcony",
        count: 2,
        titleAr: "الشرفة",
        titleEn: "Balcony",
        noteAr: "صور الشرفة والإطلالة.",
        noteEn: "Balcony and view photos."
    }
];

/* =========================================================
   عدد الصور الفعلي لكل شقة ولكل غرفة
   المفتاح الأول = رقم الشقة
   المفتاح الداخلي = key تبع الغرفة من APARTMENT_ROOM_PHOTO_PLAN
========================================================= */
const APARTMENT_ROOM_COUNTS = {
    1: {
        living: 3,
        guest: 5,
        "bedroom-1": 6,
        "bedroom-2": 3,
        "bedroom-3": 4,
        kitchen: 7,
        "bathroom-1": 5,
        "bathroom-2": 4,
        "bathroom-3": 1,
        laundry: 1,
        others: 6,
        balcony: 1
    },

    2: {
        living: 5,
        guest: 5,
        "bedroom-1": 5,
        "bedroom-2": 6,
        "bedroom-3": 3,
        kitchen: 6,
        "bathroom-1": 6,
        "bathroom-2": 4,
        "bathroom-3": 1,
        laundry: 1,
        others: 5,
        balcony: 1
    },

    3: {
        living: 2,
        guest: 2,
        "bedroom-1": 2,
        "bedroom-2": 3,
        "bedroom-3": 3,
        kitchen: 3,
        "bathroom-1": 2,
        "bathroom-2": 1,
        "bathroom-3": 0,
        laundry: 1,
        others: 4,
        balcony: 2
    },

    4: {
        living: 3,
        guest: 6,
        "bedroom-1": 4,
        "bedroom-2": 3,
        "bedroom-3": 2,
        kitchen: 4,
        "bathroom-1": 4,
        "bathroom-2": 2,
        "bathroom-3": 1,
        laundry: 1,
        others: 8,
        balcony: 1
    },

    5: {
        living: 3,
        guest: 3,
        "bedroom-1": 5,
        "bedroom-2": 3,
        "bedroom-3": 4,
        kitchen: 4,
        "bathroom-1": 3,
        "bathroom-2": 3,
        "bathroom-3": 3,
        laundry: 3,
        others: 6,
        balcony: 2
    },

    6: {
        living: 3,
        guest: 4,
        "bedroom-1": 3,
        "bedroom-2": 2,
        "bedroom-3": 3,
        kitchen: 3,
        "bathroom-1": 2,
        "bathroom-2": 1,
        "bathroom-3": 2,
        laundry: 1,
        others: 6,
        balcony: 2
    }
};

/* الشقق التي تم رفع صورها فعليًا */
const APARTMENTS_WITH_PHOTOS = [1, 2, 3, 4, 5, 6];

function getApartmentRoomCount(aptId, room) {
    const id = Number(aptId);

    /*
      مهم جدًا:
      أي شقة غير موجودة هنا لن يحاول الموقع تحميل صورها.
      لما ترفع صور الشقة 4 لاحقًا، فقط أضف رقم 4 فوق.
    */
    if (!APARTMENTS_WITH_PHOTOS.includes(id)) {
        return 0;
    }

    const aptCounts = APARTMENT_ROOM_COUNTS[id] || {};

    /*
      لا نستخدم room.count كاحتياط؛ لأن هذا يسبب طلب صور غير موجودة.
      لازم العدد يكون مكتوب صراحة داخل APARTMENT_ROOM_COUNTS.
    */
    const count =
        aptCounts[room.key] ??
        aptCounts[room.folder] ??
        0;

    return Math.max(0, Number(count) || 0);
}

/* =========================================================
   نظام صور ديناميكي
   يكتشف الصور تلقائيًا حسب الملفات الموجودة داخل المجلدات
========================================================= */
const APARTMENT_IMAGE_EXTENSIONS = ["webp"];

function buildApartmentPhotoPath(aptId, folder, index, ext = "webp") {
    return `images/apartments/apt-${aptId}/${folder}/${index}.${ext}`;
}

function buildApartmentRooms(aptId, oneBalcony = false) {
    return APARTMENT_ROOM_PHOTO_PLAN.map(room => {
        const isBalcony = room.key === "balcony";

        const imageCount = getApartmentRoomCount(aptId, room);

        const images = Array.from({ length: imageCount }, (_, index) => {
            return buildApartmentPhotoPath(aptId, room.folder, index + 1, "webp");
        });

        return {
            key: room.key,
            folder: room.folder,
            titleAr: isBalcony && oneBalcony ? "الشرفة" : room.titleAr,
            titleEn: isBalcony && oneBalcony ? "Balcony" : room.titleEn,
            noteAr: isBalcony && oneBalcony ? "تحتوي هذه الشقة على شرفة واحدة." : room.noteAr,
            noteEn: isBalcony && oneBalcony ? "This apartment includes one balcony." : room.noteEn,
            images
        };
    });
}

function getApartmentGalleryImages(apt) {
    if (!apt || !Array.isArray(apt.rooms)) return [];

    const lang = getCurrentLang ? getCurrentLang() : "ar";
    const items = [];

    apt.rooms.forEach(room => {
        const roomTitle = lang === "ar" ? room.titleAr : room.titleEn;

        (room.images || []).forEach((src, index) => {
            items.push({
                src,
                roomKey: room.key,
                roomTitleAr: room.titleAr,
                roomTitleEn: room.titleEn,
                titleAr: `${room.titleAr} ${index + 1}`,
                titleEn: `${room.titleEn} ${index + 1}`,
                label: `${roomTitle} ${index + 1}`
            });
        });
    });

    return items;
}

function getApartmentImageSources(apt) {
    return getApartmentGalleryImages(apt).map(item => item.src);
}

async function loadApartmentGallery(aptId, force = false) {
    const apt = HIJAZI_APARTMENTS[aptId];

    if (!apt) return null;

    if (apt.galleryLoaded && !force) {
        return apt;
    }

    apt.rooms = buildApartmentRooms(aptId, apt.oneBalcony)
        .filter(room => room.images.length > 0);

    apt.images = getApartmentImageSources(apt);
    apt.galleryLoaded = true;
    apt.coverLoaded = true;

    return apt;
}

async function loadApartmentCoverImage(aptId) {
    const apt = HIJAZI_APARTMENTS[aptId];

    if (!apt) return null;

    if (apt.coverLoaded && apt.images && apt.images.length) {
        return apt;
    }

    const firstRoom = APARTMENT_ROOM_PHOTO_PLAN.find(room => getApartmentRoomCount(aptId, room) > 0);

    if (firstRoom) {
        apt.images = [buildApartmentPhotoPath(aptId, firstRoom.folder, 1, "webp")];
    } else {
        apt.images = [];
    }

    apt.coverLoaded = true;
    return apt;
}

async function loadAllApartmentCoverImages(ids) {
    ids.forEach(id => {
        loadApartmentCoverImage(Number(id));
    });
}
Object.keys(HIJAZI_APARTMENTS).forEach(id => {
    const apt = HIJAZI_APARTMENTS[id];
    const aptId = Number(id);

    if (!apt) return;

    /* عدد الشرفات لكل شقة مصدره js/amenities-data.js */
    if (typeof HIJAZI_AMENITIES !== "undefined" && HIJAZI_AMENITIES.getApartment(aptId)) {
        apt.oneBalcony = HIJAZI_AMENITIES.getApartment(aptId).balconies === 1;
    }

    apt.rooms = buildApartmentRooms(aptId, apt.oneBalcony);
    apt.images = [];
    apt.video = "";

    if (apt.oneBalcony) {
        apt.featuresAr = apt.featuresAr.map(f => f === "شرفتان" ? "شرفة واحدة" : f);
        apt.featuresEn = apt.featuresEn.map(f => f === "2 Balconies" ? "1 Balcony" : f);
    }

    /*
      المواصفات الدقيقة لكل شقة (المساحة، عدد الأشخاص، الشرفات، التراس...)
      مصدرها js/amenities-data.js. الصفحات التي تعرض الشقق تحمّل ذلك الملف
      قبل main.js، وعندها تُستبدل القائمة العامة بمواصفات الشقة نفسها.
    */
    if (typeof HIJAZI_AMENITIES !== "undefined" && HIJAZI_AMENITIES.getApartment(aptId)) {
        const facts = HIJAZI_AMENITIES.getApartment(aptId);

        apt.bedrooms = facts.bedrooms;
        apt.featuresAr = HIJAZI_AMENITIES.featureList(aptId, "ar");
        apt.featuresEn = HIJAZI_AMENITIES.featureList(aptId, "en");
    }
});
/* =========================
   النصوص المشتركة للترجمة
========================= */
const SITE_TRANSLATIONS = {
    ar: {
        home: "الرئيسية",
        apartments: "الشقق",
        booking: "الحجز",
        amenities: "المميزات",
        about: "من نحن",
        faq: "الأسئلة الشائعة",
        reviews: "التقييمات",
        chooseHijazi: "لماذا تختار Hijazi",
        contactUs: "التحقق من التوافر عبر واتس اب",
        copyright: "© 2026 HIJAZI Apartments - جميع الحقوق محفوظة",
        footerDesc: "شقق مفروشة راقية في قلب عمان الشميساني مناسبة للإقامة الطبية والتنفيذية بالقرب من المستشفيات والمطاعم والكافيهات.",
        address: "عمان، الأردن، الشميساني",
        mapLink: "الموقع على خرائط جوجل",
        phoneLabel: "الهاتف",
        emailLabel: "البريد",
        whatsappLabel: "واتساب",
        footerContact: "تواصل معنا",
        social: "السوشال ميديا",
        longStayNote: "خصم ذهبي للإقامة أكثر من شهر",
        longStayAlert: "سوف يتم التواصل معك للحصول على خصم خاص",
        langArabic: "العربية",
        langEnglish: "English"
    },
    en: {
        home: "Home",
        apartments: "Apartments",
        booking: "Booking",
        amenities: "Amenities",
        about: "About Us",
        faq: "FAQ",
        reviews: "Reviews",
        chooseHijazi: "Why Hijazi",
        contactUs: "Check availability on WhatsApp",
        copyright: "© 2026 HIJAZI Apartments - All rights reserved",
        footerDesc: "Elegant furnished apartments in the heart of Amman, Shmeisani, ideal for medical and executive stays near hospitals, restaurants, and cafés.",
        address: "Amman, Jordan, Shmeisani",
        mapLink: "Location on Google Maps",
        phoneLabel: "Phone",
        emailLabel: "Email",
        whatsappLabel: "WhatsApp",
        footerContact: "Contact us",
        social: "Social Media",
        longStayNote: "Golden discount for stays longer than one month",
        longStayAlert: "We will contact you to offer a special discount",
        langArabic: "العربية",
        langEnglish: "English"
    }
};

/* =========================
   اللغة الحالية
========================= */
function getCurrentLang() {
    // Pages that exist in one language only (e.g. landing pages with -en twins) set HIJAZI_PAGE_LANG.
    if (window.HIJAZI_PAGE_LANG === "ar" || window.HIJAZI_PAGE_LANG === "en") return window.HIJAZI_PAGE_LANG;
    try {
        return localStorage.getItem("siteLang") || "ar";
    } catch (e) {
        return "ar";
    }
}

function setCurrentLang(lang) {
    try {
        localStorage.setItem("siteLang", lang);
    } catch (e) { }
}

/* =========================
   اتجاه الصفحة حسب اللغة
========================= */
function applyDocumentDirection() {
    const lang = getCurrentLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    if (document.body) {
        document.body.classList.toggle("ltr-mode", lang === "en");
    }
}

/* =========================
   إنشاء الهيدر المشترك
   showAdminTrigger = true فقط في الصفحة الرئيسية
========================= */
function renderSharedHeader(activePage, showAdminTrigger = false) {
    const lang = getCurrentLang();
    const t = SITE_TRANSLATIONS[lang];
    const headerHost = document.getElementById("sharedHeader");
    if (!headerHost) return;

    const brandClass = showAdminTrigger ? "admin-trigger" : "";
    const navId = "mainNavbarCollapse";

    headerHost.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark fixed-top custom-navbar">
            <div class="container">
                <a class="navbar-brand gold ${brandClass}" href="${showAdminTrigger ? "javascript:void(0)" : (lang === "en" ? "index-en.html" : "/")}">
                    HIJAZI Apartments
                </a>

                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#${navId}" aria-controls="${navId}" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="${navId}">
                    <ul class="navbar-nav mx-auto align-items-lg-center">
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "index" ? "active" : ""}" href="${lang === "en" ? "index-en.html" : "/"}">${t.home}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "apartments" ? "active" : ""}" href="${lang === "en" ? "apartments-en.html" : "apartments.html"}">${t.apartments}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "booking" ? "active" : ""}" href="booking.html">${t.booking}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "amenities" ? "active" : ""}" href="${lang === "en" ? "amenities-en.html" : "amenities.html"}">${t.amenities}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "about" ? "active" : ""}" href="${lang === "en" ? "about-en.html" : "about.html"}">${t.about}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "faq" ? "active" : ""}" href="${lang === "en" ? "faq-en.html" : "faq.html"}">${t.faq}</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${activePage === "reviews" ? "active" : ""}" href="${lang === "en" ? "reviews-en.html" : "reviews.html"}">${t.reviews}</a>
                        </li>
                    </ul>

                    <div class="lang-switcher-wrapper">
                        <div class="lang-switcher">
                            <button type="button" class="lang-btn ${lang === "ar" ? "active" : ""}" onclick="switchLanguage('ar')">
                                ${t.langArabic}
                            </button>
                            <button type="button" class="lang-btn ${lang === "en" ? "active" : ""}" onclick="switchLanguage('en')">
                                ${t.langEnglish}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;

    if (showAdminTrigger) {
        initAdminTrigger();
    }

    initNavbarMobileBehavior(navId);
}

/* =========================
   تحسين سلوك الهيدر على الموبايل
========================= */
function initNavbarMobileBehavior(navId = "mainNavbarCollapse") {
    const navCollapseEl = document.getElementById(navId);
    const toggler = document.querySelector(`.navbar-toggler[data-bs-target="#${navId}"]`);

    if (!navCollapseEl || !toggler || typeof bootstrap === "undefined") return;

    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapseEl, { toggle: false });

    const navLinks = navCollapseEl.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth < 992 && navCollapseEl.classList.contains("show")) {
                bsCollapse.hide();
            }
        });
    });

    document.addEventListener("click", (e) => {
        if (window.innerWidth >= 992) return;
        if (!navCollapseEl.classList.contains("show")) return;

        const clickedInsideMenu = navCollapseEl.contains(e.target);
        const clickedToggler = toggler.contains(e.target);

        if (!clickedInsideMenu && !clickedToggler) {
            bsCollapse.hide();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth >= 992 && navCollapseEl.classList.contains("show")) {
            bsCollapse.hide();
        }
    });
}

/* =========================
   إنشاء الفوتر المشترك
========================= */
function renderSharedFooter() {
    const lang = getCurrentLang();
    const t = SITE_TRANSLATIONS[lang];
    const footerHost = document.getElementById("sharedFooter");
    if (!footerHost) return;

    footerHost.innerHTML = `
        <footer class="site-footer">
            <div class="footer-container">
                <div class="footer-box">
                    <h3>HIJAZI Apartments</h3>
                    <p>${t.footerDesc}</p>
                </div>

                <div class="footer-box">
                    <h4>${t.footerContact}</h4>
                    <div class="footer-actions">
                        <a class="footer-action" href="tel:+962789000444">
                            <span class="footer-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                            <span class="footer-action-text"><span class="footer-action-label">${t.phoneLabel}</span><span class="footer-action-value" dir="ltr">+962 78 900 0444</span></span>
                        </a>
                        <a class="footer-action" href="https://wa.me/962789000444" target="_blank" rel="noopener noreferrer">
                            <span class="footer-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 7.9 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.7-1-1 .7a4 4 0 0 1-2.5-2.5l.7-1-1-1.7z"/></svg></span>
                            <span class="footer-action-text"><span class="footer-action-label">${t.whatsappLabel}</span><span class="footer-action-value" dir="ltr">+962 78 900 0444</span></span>
                        </a>
                        <a class="footer-action" href="mailto:info@hijazi-apartments.com">
                            <span class="footer-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></span>
                            <span class="footer-action-text"><span class="footer-action-label">${t.emailLabel}</span><span class="footer-action-value" dir="ltr">info@hijazi-apartments.com</span></span>
                        </a>
                        <a class="footer-action" href="${HIJAZI_MAP_URL}" target="_blank" rel="noopener">
                            <span class="footer-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                            <span class="footer-action-text"><span class="footer-action-label">${t.address}</span><span class="footer-action-value">${t.mapLink}</span></span>
                        </a>
                    </div>
                </div>

                <div class="footer-box">
                    <h4>${t.social}</h4>
                    <div class="social-links">
                        <a href="https://www.instagram.com/hijazi.apartments/" target="_blank" rel="noopener noreferrer">Instagram</a>
                        <a href="https://www.facebook.com/people/Hijazi-Apartments/61596304963608/" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://www.booking.com/hotel/jo/hijazi-apartments.html" target="_blank" rel="noopener noreferrer">Booking.com</a>
                        <a href="https://www.airbnb.com/users/show/554726817" target="_blank" rel="noopener noreferrer">Airbnb</a>
                    </div>
                </div>
            </div>

            <div class="footer-bottom">${t.copyright}</div>
        </footer>
    `;
}

/* =========================
   زر واتساب مشترك
========================= */
function renderWhatsAppWidget() {
    const lang = getCurrentLang();
    const t = SITE_TRANSLATIONS[lang];
    const host = document.getElementById("sharedWhatsApp");
    if (!host) return;

    host.innerHTML = `
        <div class="whatsapp-widget">
            <a class="whatsapp-label" href="https://wa.me/962789000444?text=Hello%20HIJAZI%20Apartments" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">${t.contactUs}</a>
            <a href="https://wa.me/962789000444?text=Hello%20HIJAZI%20Apartments"
               class="whatsapp-float"
               target="_blank"
               rel="noopener noreferrer"
               aria-label="WhatsApp">
                <span class="whatsapp-pulse"></span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="30" height="30" fill="white">
                    <path d="M19.11 17.27c-.27-.13-1.58-.78-1.82-.87-.24-.09-.41-.13-.59.14-.18.27-.68.87-.84 1.04-.15.18-.31.2-.58.07-.27-.13-1.12-.41-2.13-1.3-.79-.7-1.32-1.57-1.47-1.84-.15-.27-.02-.42.11-.55.11-.11.27-.29.41-.43.14-.15.18-.25.27-.43.09-.18.05-.34-.02-.48-.07-.13-.59-1.43-.81-1.96-.21-.5-.43-.43-.59-.44h-.5c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.65 1.11 2.83c.14.18 1.92 2.93 4.65 4.11.65.28 1.16.45 1.56.58.66.21 1.26.18 1.73.11.53-.08 1.58-.65 1.8-1.27.22-.63.22-1.16.15-1.27-.06-.12-.24-.18-.5-.31z"></path>
                    <path d="M16.02 3.2c-7.07 0-12.8 5.72-12.8 12.77 0 2.25.59 4.45 1.71 6.39L3.1 28.8l6.63-1.73a12.8 12.8 0 0 0 6.29 1.69h.01c7.06 0 12.79-5.72 12.79-12.77 0-3.42-1.34-6.63-3.79-9.04A12.76 12.76 0 0 0 16.02 3.2zm0 23.39h-.01a10.62 10.62 0 0 1-5.41-1.49l-.39-.23-3.94 1.03 1.05-3.84-.25-.4a10.55 10.55 0 0 1-1.63-5.61c0-5.84 4.76-10.59 10.6-10.59 2.82 0 5.47 1.09 7.47 3.08a10.5 10.5 0 0 1 3.11 7.51c0 5.84-4.76 10.59-10.6 10.59z"></path>
                </svg>
            </a>
        </div>
    `;
    initWhatsAppLabelDimming(host);
}

/* جملة واتساب تخفت إذا لم يلمس الزائر الشاشة 3.5 ثوانٍ (غالبًا يقرأ)،
   وتضيء من جديد عند أي لمسة على الصفحة. الأيقونة الخضراء تبقى كما هي.
   اللمس داخل حقول الكتابة لا يضيئها، حتى لا تزعج من يملأ نموذجًا.
   وفي صفحة الحجز تختفي الجملة كليًا ما دام زر تأكيد الحجز ظاهرًا. */
function initWhatsAppLabelDimming(host) {
    const state = window.__hijaziWaDim || (window.__hijaziWaDim = { timer: 0, ready: false });
    const IDLE_MS = 3500;
    const getLabel = () => host.querySelector(".whatsapp-label");

    function wake() {
        const label = getLabel();
        if (!label) return;
        label.classList.remove("is-dim");
        clearTimeout(state.timer);
        state.timer = setTimeout(() => {
            const current = getLabel();
            if (current) current.classList.add("is-dim");
        }, IDLE_MS);
    }
    state.wake = wake;
    wake();

    if (state.ready) return; // المستمعات تُضاف مرة واحدة حتى لو أُعيد رسم الزر
    state.ready = true;

    document.addEventListener("pointerdown", (event) => {
        const target = event.target;
        if (target.closest && target.closest("input, textarea, select, [contenteditable='true']")) return;
        state.wake();
    }, { passive: true });

    const submit = document.querySelector("#bookingForm [type='submit']");
    if (submit && "IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            const label = getLabel();
            if (label) label.classList.toggle("is-quiet", entries[0].isIntersecting);
        }).observe(submit);
    }
}

/* =========================
   تغيير اللغة وإعادة تحميل الصفحة
========================= */
function switchLanguage(lang) {
    setCurrentLang(lang);
    const altPages = window.HIJAZI_ALT_PAGES;
    if (altPages && altPages[lang]) {
        // نحافظ على التواريخ (?checkIn=...) لما ننتقل للنسخة الثانية
        location.href = altPages[lang] + location.search + location.hash;
        return;
    }
    location.reload();
}

/* =========================
   حساب عدد الليالي
========================= */
function calcNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
}

/* =========================
   فحص الإقامة الطويلة
========================= */
function isLongStay(checkIn, checkOut) {
    return calcNights(checkIn, checkOut) >= 30;
}

/* =========================
   رسالة الخصم الذهبي
========================= */
function renderLongStayNotice(containerId, checkIn, checkOut) {
    const lang = getCurrentLang();
    const t = SITE_TRANSLATIONS[lang];
    const host = document.getElementById(containerId);
    if (!host) return;

    const nights = calcNights(checkIn, checkOut);

    if (nights >= 30) {
        host.innerHTML = `
            <div class="long-stay-box">
                <strong>${t.longStayNote}</strong>
                <div>${t.longStayAlert}</div>
            </div>
        `;
    } else {
        host.innerHTML = `
            <div class="long-stay-note">${t.longStayNote}</div>
        `;
    }
}

/* =========================
   تفعيل دخول الأدمن المخفي
   فقط للصفحة الرئيسية
========================= */
function initAdminTrigger() {
    let adminTapCount = 0;
    let adminTapTimer = null;
    const adminTriggers = document.querySelectorAll(".admin-trigger");

    adminTriggers.forEach((trigger) => {
        trigger.style.cursor = "pointer";

        trigger.addEventListener("click", function (e) {
            e.preventDefault();
            adminTapCount++;

            if (!adminTapTimer) {
                adminTapTimer = setTimeout(() => {
                    adminTapCount = 0;
                    adminTapTimer = null;
                }, 3000);
            }

            if (adminTapCount >= 5) {
                window.location.href = "admin.html";
            }
        });
    });
}

/* =========================
   زر الصعود للأعلى
========================= */
function renderScrollTopButton() {
    const existing = document.getElementById("scrollTopBtn");
    if (existing) return;

    // حلقة حوالين الزر بتتعبى مع النزول بالصفحة، وبتكمل لما توصل آخرها
    if (!document.getElementById("scrollTopRingStyle")) {
        const style = document.createElement("style");
        style.id = "scrollTopRingStyle";
        style.textContent = `
            .scroll-top-btn { overflow: visible; }
            .scroll-top-btn .scroll-top-ring {
                position: absolute; inset: -6px;
                width: calc(100% + 12px); height: calc(100% + 12px);
                transform: rotate(-90deg); pointer-events: none;
            }
            .scroll-top-ring .ring-track { stroke: rgba(184, 134, 11, .18); }
            .scroll-top-ring .ring-bar { stroke: #b8860b; transition: stroke-dashoffset .12s linear; }
            .scroll-top-btn.is-done .ring-bar { stroke: #8a6508; }
            .scroll-top-btn .scroll-top-arrow { position: relative; }
        `;
        document.head.appendChild(style);
    }

    const btn = document.createElement("button");
    btn.id = "scrollTopBtn";
    btn.className = "scroll-top-btn";
    btn.setAttribute("aria-label", "Scroll to top");
    btn.innerHTML =
        '<svg class="scroll-top-ring" viewBox="0 0 66 66" aria-hidden="true">' +
        '<circle class="ring-track" cx="33" cy="33" r="30" fill="none" stroke-width="3"></circle>' +
        '<circle class="ring-bar" cx="33" cy="33" r="30" fill="none" stroke-width="3" stroke-linecap="round"></circle>' +
        "</svg>" +
        '<span class="scroll-top-arrow">↑</span>';
    document.body.appendChild(btn);

    const bar = btn.querySelector(".ring-bar");
    const length = 2 * Math.PI * 30;
    bar.style.strokeDasharray = String(length);
    bar.style.strokeDashoffset = String(length);

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    let ticking = false;
    function update() {
        ticking = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.style.strokeDashoffset = String(length * (1 - progress));
        btn.classList.toggle("is-done", progress >= 0.995);
        btn.style.display = window.scrollY > 250 ? "block" : "none";
    }

    window.addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
}

/* =========================
   تأثير دخول العناصر أثناء التمرير
========================= */
function initFadeInSections() {
    const sections = document.querySelectorAll(".fade-in-section");
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, {
        threshold: 0.15
    });

    sections.forEach(section => observer.observe(section));
}

/* =========================
   تشغيل عام
========================= */
document.addEventListener("DOMContentLoaded", () => {
    applyDocumentDirection();
    renderScrollTopButton();
    initFadeInSections();
});

/* =========================================================
   HIJAZI Glass Date Picker
   يستبدل تقويم المتصفح الأصلي بتقويم زجاجي
========================================================= */

function initHijaziGlassDatePickers() {
    if (!window.HijaziDatePicker) return;

    const lang = getCurrentLang ? getCurrentLang() : "ar";

    const dateInputs = document.querySelectorAll('input[type="date"], input.glass-date-input');

    dateInputs.forEach(input => {
        if (input._flatpickr) return;

        window.HijaziDatePicker.create(input, {
            minDate: input.min || "today",
            locale: lang === "ar" ? flatpickr.l10ns.ar : "default",
        });
    });

    function linkDatePair(checkIn, checkOut) {
        if (!checkIn?._flatpickr || !checkOut?._flatpickr) return;

        checkIn.addEventListener("change", function () {
            const earliestCheckOut = checkIn.value
                ? window.HijaziDatePicker.nextDateKey(checkIn.value)
                : "today";

            checkOut._flatpickr.set("minDate", earliestCheckOut);

            if (checkOut.value && checkIn.value && checkOut.value <= checkIn.value) {
                checkOut._flatpickr.clear();
            }
        });
    }

    linkDatePair(
        document.getElementById("checkIn"),
        document.getElementById("checkOut")
    );

    linkDatePair(
        document.getElementById("mobileCheckIn"),
        document.getElementById("mobileCheckOut")
    );
}

document.addEventListener("DOMContentLoaded", initHijaziGlassDatePickers);
