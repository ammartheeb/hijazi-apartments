/* =========================================================
   HIJAZI – أقسام صفحة التجهيزات قابلة للطي على الهاتف

   على الشاشات حتى 768px يصير عنوان كل قسم زرًا يفتح القسم ويغلقه،
   فتقصر الصفحة من نحو 22 شاشة إلى قائمة عناوين. «أهم المميزات» و«الشقق»
   تبقى مفتوحة. على الكمبيوتر لا يتغير شيء.

   - المحتوى يبقى في HTML كما هو (محركات البحث تقرؤه).
   - hidden="until-found": البحث داخل الصفحة في Chrome يفتح القسم تلقائيًا.
   - روابط شريط الأقسام (#kitchen …) والرابط المباشر بـ # تفتح القسم المطلوب.
========================================================= */
(function () {
    "use strict";

    const root = document.querySelector("main.am-page-content");
    if (!root) return;

    const phone = window.matchMedia("(max-width: 768px)");
    const KEEP_OPEN = ["highlights", "units"];
    const sections = [];

    function setOpen(item, open) {
        item.button.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
            item.body.removeAttribute("hidden");
        } else {
            item.body.setAttribute("hidden", "until-found");
        }
        item.section.classList.toggle("am-collapsed", !open);
    }

    function build() {
        root.querySelectorAll(".am-section[id]").forEach((section) => {
            if (KEEP_OPEN.includes(section.id)) return;
            const heading = section.querySelector(":scope > h2");
            if (!heading) return;

            const body = document.createElement("div");
            body.className = "am-collapse-body";
            body.id = section.id + "-body";
            while (heading.nextSibling) body.appendChild(heading.nextSibling);
            section.appendChild(body);

            const button = document.createElement("button");
            button.type = "button";
            button.className = "am-collapse-toggle";
            button.setAttribute("aria-controls", body.id);
            while (heading.firstChild) button.appendChild(heading.firstChild);
            const hint = document.createElement("span");
            hint.className = "am-collapse-icon";
            hint.setAttribute("aria-hidden", "true");
            button.appendChild(hint);
            heading.appendChild(button);

            const item = { section, heading, body, button };
            button.addEventListener("click", () => {
                setOpen(item, button.getAttribute("aria-expanded") !== "true");
            });
            body.addEventListener("beforematch", () => setOpen(item, true));
            sections.push(item);
            setOpen(item, false);
        });
    }

    function openFromHash() {
        const id = decodeURIComponent((location.hash || "").slice(1));
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        const item = sections.find((s) => s.section.contains(target));
        if (item && item.button.getAttribute("aria-expanded") !== "true") {
            setOpen(item, true);
            requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
        }
    }

    function applyMode() {
        if (phone.matches) {
            if (!sections.length) build();
            openFromHash();
        } else {
            sections.forEach((item) => setOpen(item, true));
        }
    }

    // روابط داخل الصفحة: افتح القسم قبل أن يقفز المتصفح إليه.
    document.addEventListener("click", (event) => {
        const link = event.target.closest && event.target.closest('a[href^="#"]');
        if (!link || !sections.length) return;
        const target = document.getElementById(decodeURIComponent(link.getAttribute("href").slice(1)));
        const item = target && sections.find((s) => s.section.contains(target));
        if (item) setOpen(item, true);
    });
    window.addEventListener("hashchange", openFromHash);
    if (phone.addEventListener) phone.addEventListener("change", applyMode);

    const style = document.createElement("style");
    style.textContent = `
        .am-collapse-toggle {
            all: unset;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
            min-height: 44px;
            cursor: pointer;
            text-align: start;
            -webkit-tap-highlight-color: transparent;
        }
        .am-collapse-toggle:focus-visible {
            outline: 2px solid #d4a017;
            outline-offset: 4px;
            border-radius: 8px;
        }
        .am-collapse-icon {
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(212, 160, 23, 0.55);
            position: relative;
        }
        .am-collapse-icon::before {
            content: "";
            position: absolute;
            top: 11px;
            left: 12px;
            width: 8px;
            height: 8px;
            border-right: 2px solid #b8860b;
            border-bottom: 2px solid #b8860b;
            transform: rotate(45deg);
            transition: transform 0.25s ease, top 0.25s ease;
        }
        .am-collapse-toggle[aria-expanded="true"] .am-collapse-icon::before {
            top: 14px;
            transform: rotate(225deg);
        }
        .am-section.am-collapsed > h2 {
            margin-bottom: 0;
        }
        .am-section.am-collapsed {
            padding-top: 14px;
            padding-bottom: 14px;
        }
    `;
    document.head.appendChild(style);

    applyMode();
})();
