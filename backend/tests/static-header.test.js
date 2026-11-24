const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { run } = require("../../scripts/build-static-header.js");
const FRONTEND = path.join(__dirname, "..", "..", "frontend");

test("every public page has the static header and it matches main.js", () => {
    // If this fails: run `node scripts/build-static-header.js` from the project root.
    assert.deepEqual(run({ check: true }), []);
    const pages = fs.readdirSync(FRONTEND).filter(f => f.endsWith(".html") && f !== "admin.html");
    for (const page of pages) {
        const html = fs.readFileSync(path.join(FRONTEND, page), "utf8");
        assert.match(html, /<div id="sharedHeader" data-static-lang="(ar|en)" data-static-active="[a-z]+"><!-- HEADER:START -->/, `${page} has no static header`);
        const lang = html.match(/<html[^>]*lang="(ar|en)"/)[1];
        assert.ok(html.includes(`data-static-lang="${lang}"`), `${page}: header language differs from the page`);
    }
});
