/* =========================================================
   خلفية صفحتي الشقق والحجز + خلفية الهيدر المتحركة.

   كل طبقة هنا <canvas> تُرسم مرة واحدة ثم يحرّكها CSS بـ transform/opacity فقط.
   السبب: طبقة canvas تأخذ من ذاكرة كرت الشاشة بقدر دقة الرسم نفسها، فالطبقات
   الناعمة (تدرّج، دخان، غيوم، لمعة) تُرسم بدقة منخفضة وتُمدَّد دون فرق ظاهر.
   لو كانت عناصر CSS عادية لأخذت كل طبقة شاشة كاملة بالدقة الكاملة.

   الأشكال والألوان هنا مطابقة لتدرّجات CSS الأصلية؛ عند تعديل الشكل عدّل هنا.
   ========================================================= */
(function () {
    "use strict";

    var GOLD = "212, 160, 23";
    var SOFT = 1 / 6;            /* دقة الطبقات الناعمة نسبةً إلى بكسل CSS */
    var mobileQuery = window.matchMedia("(max-width: 768px)");

    function rgba(rgb, a) { return "rgba(" + rgb + ", " + a + ")"; }

    /* يجهّز الـ canvas بدقة (scale) ويرجع سياق الرسم بإحداثيات بكسل CSS */
    function prepare(canvas, scale, minW, minH) {
        var w = canvas.offsetWidth, h = canvas.offsetHeight;
        if (!w || !h) return null;
        canvas.width = Math.max(minW || 2, Math.round(w * scale));
        canvas.height = Math.max(minH || 2, Math.round(h * scale));
        var ctx = canvas.getContext("2d");
        ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
        ctx.clearRect(0, 0, w, h);
        return { ctx: ctx, w: w, h: h };
    }

    /* مثل radial-gradient(circle at x% y%, color, transparent stop%) داخل صندوق */
    function blob(ctx, box, xPct, yPct, rgb, alpha, stopPct, clip) {
        var cx = box.x + box.w * xPct / 100, cy = box.y + box.h * yPct / 100;
        var dx = Math.max(cx - box.x, box.x + box.w - cx);
        var dy = Math.max(cy - box.y, box.y + box.h - cy);
        var r = Math.sqrt(dx * dx + dy * dy) * stopPct / 100;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, rgba(rgb, alpha));
        g.addColorStop(1, rgba(rgb, 0));
        ctx.fillStyle = g;
        ctx.fillRect(clip.x, clip.y, clip.w, clip.h);
    }

    var painters = {
        /* التدرّج الأساسي: العنصر بعرض 230% والبلاطة الأصلية 230% × 230% متمركزة عمودياً */
        base: function (canvas, page) {
            var p = prepare(canvas, SOFT); if (!p) return;
            var clip = { x: 0, y: 0, w: p.w, h: p.h };
            var box = { x: 0, y: -0.65 * p.h, w: p.w, h: 2.3 * p.h };
            p.ctx.fillStyle = "#ffffff";
            p.ctx.fillRect(0, 0, p.w, p.h);
            blob(p.ctx, box, 88, 32, "0, 0, 0", page === "booking" ? 0.18 : 0.16, 27, clip);
            blob(p.ctx, box, 12, 20, GOLD, 0.30, 25, clip);
        },

        smoke: function (canvas) {
            var p = prepare(canvas, SOFT); if (!p) return;
            var box = { x: 0, y: 0, w: p.w, h: p.h };
            blob(p.ctx, box, 70, 18, GOLD, 0.12, 28, box);
            blob(p.ctx, box, 48, 58, "0, 0, 0", 0.12, 42, box);
            blob(p.ctx, box, 98, 66, "0, 0, 0", 0.26, 38, box);
            blob(p.ctx, box, 2, 38, "0, 0, 0", 0.30, 34, box);
        },

        /* غيمة ذهبية: كانت تدرّجاً دائرياً مع blur(20px)؛ التنعيم الآن داخل التدرّج نفسه */
        orb: function (canvas) {
            var p = prepare(canvas, SOFT); if (!p) return;
            var c = p.w / 2, cut = p.w * 0.4808;
            var g = p.ctx.createRadialGradient(c, c, 0, c, c, cut * 1.1);
            g.addColorStop(0, rgba(GOLD, 0.70));
            g.addColorStop(0.10, rgba(GOLD, 0.672));
            g.addColorStop(0.82, rgba(GOLD, 0.078));
            g.addColorStop(0.92, rgba(GOLD, 0.022));
            g.addColorStop(1, rgba(GOLD, 0));
            p.ctx.fillStyle = g;
            p.ctx.fillRect(0, 0, p.w, p.h);
        },

        shine: function (canvas) {
            var p = prepare(canvas, 0, 128, 2); if (!p) return;
            var g = p.ctx.createLinearGradient(0, 0, p.w, 0);
            g.addColorStop(0, "rgba(255, 255, 255, 0)");
            g.addColorStop(0.38, "rgba(255, 255, 255, 0.70)");
            g.addColorStop(0.50, rgba(GOLD, 0.30));
            g.addColorStop(0.58, "rgba(0, 0, 0, 0.10)");
            g.addColorStop(1, "rgba(0, 0, 0, 0)");
            p.ctx.fillStyle = g;
            p.ctx.fillRect(0, 0, p.w, p.h);
        },

        dust1: function (canvas, page) {
            var m = mobileQuery.matches;
            dots(canvas, [
                { size: m ? 145 : 130, r: 2, color: rgba(GOLD, 0.45), x: 70, y: 90 },
                { size: m ? 82 : 68, r: 1.2, color: rgba("255, 255, 255", page === "booking" ? 1 : 0.98), x: 22, y: 28 },
                { size: m ? 42 : 34, r: 1.4, color: rgba(GOLD, 0.75), x: 0, y: 0 }
            ]);
        },

        dust2: function (canvas) {
            var m = mobileQuery.matches;
            dots(canvas, [
                { size: m ? 170 : 160, r: 3, color: "rgba(30, 24, 12, 0.42)", x: 110, y: 140 },
                { size: m ? 105 : 95, r: 2.4, color: "rgba(0, 0, 0, 0.34)", x: 60, y: 80 },
                { size: m ? 50 : 42, r: 1.4, color: "rgba(0, 0, 0, 0.62)", x: 18, y: 12 }
            ]);
        },

        twinkle: function (canvas) {
            dots(canvas, [
                { size: 115, r: 0.9, color: "rgba(0, 0, 0, 0.28)", x: 44, y: 70 },
                { size: 145, r: 1.1, color: rgba(GOLD, 0.85), x: 75, y: 100 },
                { size: 95, r: 1, color: "rgba(255, 255, 255, 1)", x: 18, y: 36 }
            ]);
        },

        /* خلفية الهيدر: linear-gradient(120deg, ...) على صندوق 350% × 350%، والظاهر شريطه الأوسط */
        header: function (canvas) {
            var p = prepare(canvas, SOFT); if (!p) return;
            var bw = p.w, bh = 3.5 * p.h, top = -1.25 * p.h;
            var sin = Math.sin(120 * Math.PI / 180), cos = Math.cos(120 * Math.PI / 180);
            var half = (Math.abs(bw * sin) + Math.abs(bh * cos)) / 2;
            var cx = bw / 2, cy = top + bh / 2;
            var g = p.ctx.createLinearGradient(cx - sin * half, cy + cos * half, cx + sin * half, cy - cos * half);
            ["#c89116", "#5a3b00", "#000000", "#9b7108", "#000000"].forEach(function (color, i) {
                g.addColorStop(i / 4, color);
            });
            p.ctx.fillStyle = g;
            p.ctx.fillRect(0, 0, p.w, p.h);
        }
    };

    /* نقاط الغبار والنجوم: حادة، فتُرسم بدقة أعلى (حتى 1.5×) */
    function dots(canvas, layers) {
        var scale = Math.min(window.devicePixelRatio || 1, 1.5);
        var p = prepare(canvas, scale); if (!p) return;
        layers.forEach(function (l) {
            p.ctx.fillStyle = l.color;
            p.ctx.beginPath();
            var x0 = ((l.x + l.size / 2) % l.size) - l.size;
            var y0 = ((l.y + l.size / 2) % l.size) - l.size;
            for (var y = y0; y < p.h + l.size; y += l.size) {
                for (var x = x0; x < p.w + l.size; x += l.size) {
                    p.ctx.moveTo(x + l.r, y);
                    p.ctx.arc(x, y, l.r, 0, Math.PI * 2);
                }
            }
            p.ctx.fill();
        });
    }

    var lastW = 0, lastH = 0;

    function paintAll(force) {
        var w = window.innerWidth, h = window.innerHeight;
        /* شريط العنوان في الموبايل يغيّر الارتفاع قليلاً أثناء التمرير؛ لا نعيد الرسم لأجله */
        if (!force && w === lastW && Math.abs(h - lastH) < 140) return;
        lastW = w; lastH = h;
        var nodes = document.querySelectorAll("canvas[data-fx]");
        for (var i = 0; i < nodes.length; i++) {
            var paint = painters[nodes[i].getAttribute("data-fx")];
            if (!paint) continue;
            try { paint(nodes[i], nodes[i].getAttribute("data-page") || ""); } catch (e) { /* الخلفية زينة فقط */ }
        }
    }

    var timer = null;
    function onResize() {
        clearTimeout(timer);
        timer = setTimeout(function () { paintAll(false); }, 150);
    }

    paintAll(true);
    window.addEventListener("resize", onResize, { passive: true });
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", function () { paintAll(true); });
})();
