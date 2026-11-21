/* Site key يأتي من إعدادات API العامة؛ Secret key يبقى داخل Render. */
(() => {
    "use strict";
    const API_BASE = "https://api.hijazi-apartments.com";
    let initialization;
    let config;
    let widgetId;
    let token = "";
    let needsInteraction = false;
    let tokenWaiters = [];

    /* التحقق يجري في الخلفية (appearance: interaction-only): لا يظهر المربع إلا إذا
       طلبت Cloudflare تفاعلًا من الزائر. عند الإرسال ننتظر الرمز بضع ثوانٍ إن لم يصل بعد. */
    function resolveWaiters() {
        tokenWaiters.forEach(fn => fn());
        tokenWaiters = [];
    }
    function waitForToken(ms) {
        if (token) return Promise.resolve();
        return new Promise(resolve => {
            const timer = setTimeout(resolve, ms);
            tokenWaiters.push(() => { clearTimeout(timer); resolve(); });
        });
    }

    function message(ar, en) {
        return document.documentElement.lang === "en" ? en : ar;
    }
    /* الرسالة تظهر تحت مربع التحقق مباشرة، مش أعلى النموذج. */
    function setStatus(text, type = "info") {
        const el = document.getElementById("bookingSecurityStatus");
        if (!el) return;
        el.textContent = text;
        el.hidden = !text;
        el.className = text ? `action-msg action-msg-${type}` : "";
    }
    function loadScript() {
        if (window.turnstile) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error("Turnstile loading timeout"));
            }, 15000);
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.onload = () => {
                clearTimeout(timeout);
                if (window.turnstile) resolve();
                else reject(new Error("Turnstile unavailable"));
            };
            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error("Turnstile script unavailable"));
            };
            document.head.appendChild(script);
        });
    }
    async function initialize() {
        if (initialization) return initialization;
        initialization = (async () => {
            const response = await fetch(`${API_BASE}/security/public-config`, {
                cache: "no-store", signal: AbortSignal.timeout(15000)
            });
            if (!response.ok) throw new Error("Security configuration unavailable");
            const data = await response.json();
            config = data.turnstile;
            if (!data.success || !config || typeof config.enabled !== "boolean") {
                throw new Error("Invalid security configuration");
            }
            const container = document.getElementById("bookingSecurity");
            if (!config.enabled) { container.hidden = true; return; }
            container.hidden = false;
            await loadScript();
            widgetId = window.turnstile.render("#bookingTurnstile", {
                sitekey: config.siteKey, action: config.action, theme: "auto", size: "flexible",
                appearance: "interaction-only",
                "before-interactive-callback"() { needsInteraction = true; },
                language: document.documentElement.lang === "en" ? "en" : "ar",
                "response-field": false,
                callback(value) { token = value; needsInteraction = false; setStatus(""); resolveWaiters(); },
                "expired-callback"() { token = ""; setStatus(message("انتهت صلاحية التحقق. ضع علامة ✓ مرة أخرى قبل الإرسال.", "The check expired. Tick it again before submitting.")); },
                "timeout-callback"() { token = ""; },
                "error-callback"() {
                    token = "";
                    setStatus(message("تعذر التحقق. تأكد من اتصالك وأعد المحاولة.", "Verification failed. Check your connection and retry."), "error");
                }
            });
        })().catch(error => { initialization = null; throw error; });
        return initialization;
    }
    window.HijaziBookingSecurity = {
        async getToken() {
            try { await initialize(); }
            catch { throw new Error(message("تعذر تحميل التحقق الأمني. أعد المحاولة أو تواصل معنا.", "Security verification could not load. Retry or contact us.")); }
            if (!config.enabled) return "";
            if (!token && !needsInteraction) await waitForToken(8000);
            if (!token && needsInteraction) throw new Error(message("ضع علامة ✓ على «التحقق من أنك إنسان» هنا، ثم اضغط «تأكيد الحجز».", "Tick “Verify you are human” here, then press “Confirm booking”."));
            if (!token) throw new Error(message("لم يكتمل التحقق الأمني بعد. انتظر لحظة ثم اضغط «تأكيد الحجز» مرة أخرى.", "The security check is not finished yet. Wait a moment, then press “Confirm booking” again."));
            return token;
        },
        reset() {
            token = "";
            if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
        }
    };
    document.addEventListener("DOMContentLoaded", () => {
        initialize().catch(() => setStatus(message("تعذر تحميل التحقق الأمني. ستتم إعادة المحاولة عند الإرسال.", "Verification could not load. We will retry when you submit."), "error"));
    });
})();
