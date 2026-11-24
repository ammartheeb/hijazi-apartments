/* =========================================================
   HIJAZI – Scroll reveal (ظهور العناصر مع التمرير بالاتجاهين)

   القواعد:
   - كل ما يظهر في الشاشة عند فتح الصفحة يبقى ظاهرًا فورًا، بلا انتظار تمرير.
   - العنصر الذي تحت حافة الشاشة يكون مخفيًا، ويظهر بحركة ناعمة عندما يصل إليه
     الزائر بالتمرير للأسفل.
   - عند التمرير للأعلى، العنصر الذي يرجع تحت حافة الشاشة يختفي من جديد،
     فيظهر مرة أخرى عند النزول.
   - العنصر الذي صار فوق الشاشة يبقى ظاهرًا، فلا يجد الزائر فراغًا عند الصعود.

   التنفيذ:
   - IntersectionObserver فقط (لا حساب في كل حدث scroll)، والحركة على
     opacity و translate فقط (لا تكلف إعادة رسم الصفحة).
   - الحركة بـ Web Animations API وخاصية translate المستقلة، فلا تمسّ
     transform و transition و hover الموجودة على البطاقات.
   - إذا تعطّل هذا الملف تبقى كل العناصر ظاهرة (لا شيء مخفي في CSS مسبقًا).
   - لا حركة لمن فعّل "تقليل الحركة" في جهازه (prefers-reduced-motion).

   الإعداد: <script src="js/scroll-reveal.js?v=1" defer></script>
   وفي لوحة الإدارة: data-profile="admin" (حركة أقصر وأخف).
========================================================= */
(function () {
    "use strict";

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (!Element.prototype.animate) return;

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion && reduceMotion.matches) return;

    const script = document.currentScript;
    const profile = (script && script.dataset.profile) || "site";

    // العناصر التي تتحرك. إذا كان عنصر داخل عنصر آخر من القائمة، يتحرك الخارجي فقط.
    const SITE_TARGETS = [
        // الصفحة الرئيسية
        ".section-title", ".faq-main-title", ".am-intro",
        ".seo-card", ".why-card", ".am-highlight", ".stat-box",
        ".luxury-seo-card", ".faq-pro-item",
        // صفحات التجهيزات ومن نحن والتقييمات
        ".am-section > h2", ".am-card", ".am-unit", ".am-faq-item",
        ".am-policies > li", ".am-stat", ".am-varies", ".am-related",
        ".am-contact", ".am-cta", ".am-highlights-more", ".rv-card",
        // صفحات الأدلة والأسئلة الشائعة
        ".white-card", ".cta-box", ".faq-item",
        // صفحة الشقق وصفحة الحجز
        ".seo-intro", ".grid > .card", ".apartment-preview-card", ".booking-form-card",
        // التذييل المشترك
        ".footer-box", ".footer-bottom"
    ];
    const ADMIN_TARGETS = [".stat-card", ".section-card"];

    const TARGETS = (profile === "admin" ? ADMIN_TARGETS : SITE_TARGETS).join(",");

    // لا نحرّك شيئًا داخل النوافذ المنبثقة وعارض الصور.
    const EXCLUDE = [
        "dialog", ".modal", "[role='dialog']", ".photo-album-modal",
        ".success-modal", ".rv-viewer", "#imageLightbox", ".lb-root"
    ].join(",");

    const isPhone = window.matchMedia("(max-width: 768px)").matches;
    const MOTION = profile === "admin"
        ? { distance: isPhone ? 12 : 16, duration: 380, stagger: 50 }
        : { distance: isPhone ? 20 : 30, duration: isPhone ? 560 : 700, stagger: 80 };
    const EASE_IN = "cubic-bezier(.22,.61,.36,1)";
    const EASE_OUT = "cubic-bezier(.4,0,1,1)";
    const MAX_STAGGER_STEPS = 4;

    // خط الإخفاء والإظهار: 8% فوق أسفل الشاشة، حتى يرى الزائر العنصر وهو يختفي
    // عند الصعود بدل أن يختفي وهو خارج الشاشة.
    const BOTTOM_MARGIN = 0.08;

    const style = document.createElement("style");
    style.textContent =
        ".sr-hidden{opacity:0 !important;translate:0 " + MOTION.distance + "px;}" +
        "@media print{.sr-hidden{opacity:1 !important;translate:none;}}";
    document.head.appendChild(style);

    const tracked = new Set();      // كل العناصر المسجّلة
    const tailItems = new Set();    // عناصر قرب نهاية الصفحة لا تصل إلى خط الظهور
    const running = new WeakMap();  // الحركة الجارية لكل عنصر
    const shown = new WeakMap();    // الحالة الحالية: true ظاهر، false مخفي

    function currentFrame(el) {
        const cs = getComputedStyle(el);
        return { opacity: cs.opacity, translate: cs.translate === "none" ? "0px 0px" : cs.translate };
    }

    function stopRunning(el) {
        const anim = running.get(el);
        if (anim) {
            anim.onfinish = null;
            anim.cancel();
            running.delete(el);
        }
    }

    function show(el, delay, animate) {
        if (shown.get(el) === true) return;
        shown.set(el, true);
        if (!animate) {
            stopRunning(el);
            el.classList.remove("sr-hidden");
            return;
        }
        const from = currentFrame(el);
        stopRunning(el);
        el.classList.remove("sr-hidden");
        const anim = el.animate(
            [from, { opacity: 1, translate: "0px 0px" }],
            { duration: MOTION.duration, delay: delay || 0, easing: EASE_IN, fill: "backwards" }
        );
        running.set(el, anim);
        anim.onfinish = () => { running.delete(el); };
    }

    function hide(el) {
        if (shown.get(el) === false) return;
        shown.set(el, false);
        const from = currentFrame(el);
        stopRunning(el);
        const anim = el.animate(
            [from, { opacity: 0, translate: "0px " + MOTION.distance + "px" }],
            { duration: Math.round(MOTION.duration * 0.6), easing: EASE_OUT, fill: "forwards" }
        );
        running.set(el, anim);
        anim.onfinish = () => {
            el.classList.add("sr-hidden");
            anim.cancel();
            running.delete(el);
        };
    }

    function viewportHeight() {
        return window.innerHeight || document.documentElement.clientHeight;
    }

    function revealLine() {
        return viewportHeight() * (1 - BOTTOM_MARGIN);
    }

    // ترتيب العناصر التي تظهر معًا: من الأعلى، ثم حسب اتجاه القراءة.
    function visualOrder(a, b) {
        const ra = a.boundingClientRect;
        const rb = b.boundingClientRect;
        if (Math.abs(ra.top - rb.top) > 8) return ra.top - rb.top;
        return document.documentElement.dir === "rtl" ? rb.left - ra.left : ra.left - rb.left;
    }

    const observer = new IntersectionObserver((entries) => {
        const entering = [];
        entries.forEach((entry) => {
            const el = entry.target;
            const rect = entry.boundingClientRect;
            if (!rect.width && !rect.height) return; // مخفي بـ display:none (مثل تبويب غير نشط)
            if (entry.isIntersecting) {
                tailItems.delete(el);
                entering.push(entry);
                return;
            }
            const rootBottom = entry.rootBounds ? entry.rootBounds.bottom : revealLine();
            if (rect.top >= rootBottom - 1) {
                if (!tailItems.has(el)) hide(el);
            } else {
                // صار فوق الشاشة: يبقى ظاهرًا بلا حركة.
                show(el, 0, false);
            }
        });
        entering.sort(visualOrder).forEach((entry, i) => {
            show(entry.target, Math.min(i, MAX_STAGGER_STEPS) * MOTION.stagger, true);
        });
    }, { rootMargin: "0px 0px -" + Math.round(BOTTOM_MARGIN * 100) + "% 0px", threshold: 0 });

    function eligible(el) {
        if (tracked.has(el)) return false;
        if (el.closest(EXCLUDE)) return false;
        const parent = el.parentElement;
        if (parent && parent.closest(TARGETS)) return false; // يتحرك العنصر الخارجي فقط
        const pos = getComputedStyle(el).position;
        return pos !== "fixed" && pos !== "sticky";
    }

    // تسجيل العناصر الجديدة. ما يظهر في الشاشة الآن يبقى ظاهرًا بلا حركة،
    // وما تحت الشاشة يُخفى إلى أن يصل إليه الزائر.
    function scan() {
        tracked.forEach((el) => {
            if (!el.isConnected) {
                observer.unobserve(el);
                stopRunning(el);
                tracked.delete(el);
                tailItems.delete(el);
            }
        });
        const vh = viewportHeight();
        document.querySelectorAll(TARGETS).forEach((el) => {
            if (!eligible(el)) return;
            tracked.add(el);
            const rect = el.getBoundingClientRect();
            const hiddenNow = rect.width || rect.height ? rect.top >= vh : false;
            if (hiddenNow) {
                shown.set(el, false);
                el.classList.add("sr-hidden");
            } else {
                shown.set(el, true);
            }
            observer.observe(el);
        });
        checkPageEnd();
    }

    // العناصر الأخيرة في الصفحة (مثل سطر حقوق النشر) قد لا تصل أبدًا إلى خط الظهور،
    // فنظهرها عند الوصول إلى نهاية الصفحة، ونخفيها عند الابتعاد عنها.
    function checkPageEnd() {
        const vh = viewportHeight();
        const doc = document.documentElement;
        const atEnd = window.scrollY + vh >= doc.scrollHeight - Math.max(4, vh * BOTTOM_MARGIN);
        if (atEnd) {
            const pending = [];
            tracked.forEach((el) => {
                if (shown.get(el) !== false) return;
                const rect = el.getBoundingClientRect();
                if ((rect.width || rect.height) && rect.top < vh) pending.push(el);
            });
            pending.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
            pending.forEach((el, i) => {
                tailItems.add(el);
                show(el, Math.min(i, MAX_STAGGER_STEPS) * MOTION.stagger, true);
            });
        } else if (tailItems.size) {
            const line = revealLine();
            tailItems.forEach((el) => {
                if (el.getBoundingClientRect().top >= line) {
                    tailItems.delete(el);
                    hide(el);
                }
            });
        }
    }

    let endTicking = false;
    window.addEventListener("scroll", () => {
        if (endTicking) return;
        endTicking = true;
        requestAnimationFrame(() => { endTicking = false; checkPageEnd(); });
    }, { passive: true });

    // عند الانتقال بلوحة المفاتيح (Tab) إلى رابط داخل عنصر مخفي، يظهر فورًا.
    document.addEventListener("focusin", (event) => {
        const el = event.target.closest && event.target.closest(".sr-hidden");
        if (el && tracked.has(el)) show(el, 0, false);
    });

    // محتوى يُرسم لاحقًا بالـ JS (بطاقات الشقق، التذييل، قوائم الإدارة).
    let scanQueued = false;
    function queueScan() {
        if (scanQueued) return;
        scanQueued = true;
        requestAnimationFrame(() => { scanQueued = false; scan(); });
    }

    /* نعيد الفحص فقط إذا أُضيف عنصر من القائمة (أو عنصر يحتوي واحدًا). التقويم وغيره يغيّرون الصفحة
       كثيرًا، وفحص الصفحة كلها مع كل تغيير كان يكلّف صفحة الحجز نحو 0.7 ثانية من عمل المعالج. */
    function relevant(records) {
        for (const record of records) {
            for (const node of record.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.matches(TARGETS) || node.querySelector(TARGETS)) return true;
            }
        }
        return false;
    }

    function start() {
        scan();
        new MutationObserver((records) => {
            if (relevant(records)) queueScan();
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
