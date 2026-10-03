#!/usr/bin/env python3
"""
build-preview.py — bundles the whole site into ONE self-contained HTML file.

WHY THIS EXISTS
  The site uses absolute paths (/style.css, /logos/x.svg, /work/kidley/).
  Those only resolve on a real server, so you can't just double-click an
  index.html and see the site. This script inlines everything — CSS, JS,
  images, fonts — into a single file with a page switcher across the top.
  Open it in any browser, no server, no internet.

USAGE
  cd into the site folder, then:
      python3 build-preview.py
  Output: preview.html in the same folder.

HOW IT WORKS
  Every page is rendered inside its own <iframe>, so each one gets a clean
  document and layout.js/main.js run exactly as they do live. Images under
  the size cap become data: URIs. Anything over the cap is left as-is and
  shows the same broken-image fallback the live site would show.

NOTE
  preview.html is a BUILD ARTIFACT. Don't commit it, and don't edit it —
  edit the real pages and re-run this script.
"""

import base64
import json
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
OUT = ROOT / "preview.html"

# Images larger than this are skipped rather than inlined, to keep the
# preview file openable. Raise it if a cover you need is being skipped.
MAX_INLINE_BYTES = 900_000

# Order of the tabs across the top of the preview.
PAGES = [
    ("home",          "index.html"),
    ("projects",      "projects/index.html"),
    ("kidley",        "work/kidley/index.html"),
    ("hem & haw",     "work/hemhaw/index.html"),
    ("dring",         "work/dring/index.html"),
    ("first & last",  "work/firstandlast/index.html"),
    ("naughty dares", "work/naughtydares/index.html"),
    ("takeoff",       "work/takeoff/index.html"),
    ("aquaflow",      "work/aquaflow/index.html"),
    ("snackify",      "work/snackify/index.html"),
    ("more work",     "selects/index.html"),
    ("about",         "about/index.html"),
    ("services",      "services/index.html"),
    ("contact",       "contact/index.html"),
    ("resume",        "resume/index.html"),
]

_asset_cache = {}


def data_uri(rel_path: str):
    """Turn /some/file.jpg into a data: URI. Returns None if unusable."""
    rel = rel_path.split("?")[0].split("#")[0].lstrip("/")
    if rel in _asset_cache:
        return _asset_cache[rel]
    f = ROOT / rel
    result = None
    if f.is_file() and f.stat().st_size <= MAX_INLINE_BYTES:
        mime = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        b64 = base64.b64encode(f.read_bytes()).decode()
        result = f"data:{mime};base64,{b64}"
    _asset_cache[rel] = result
    return result


def inline_assets(html: str) -> str:
    """Replace absolute asset paths with data: URIs where we can."""

    def sub_attr(m):
        attr, path = m.group(1), m.group(2)
        uri = data_uri(path)
        return f'{attr}="{uri}"' if uri else m.group(0)

    # src="/x.jpg", srcset="/x.webp", href="/favicon.svg"
    html = re.sub(
        r'(src|srcset|href)="(/[^"]+\.(?:jpg|jpeg|png|webp|svg|ico|gif))"',
        sub_attr,
        html,
    )
    # url(/x.png) inside inline styles
    html = re.sub(
        r'url\((["\']?)(/[^)"\']+\.(?:jpg|jpeg|png|webp|svg|gif))\1\)',
        lambda m: f"url({data_uri(m.group(2)) or m.group(2)})",
        html,
    )
    return html


def build_page(rel_html: str) -> str:
    """Prepare one page. Asset paths are left alone here — they're resolved
    at runtime against the shared asset map, so nothing is stored twice."""
    html = (ROOT / rel_html).read_text(encoding="utf-8")

    # Drop favicon/manifest links — they only cause 404 noise in preview.
    html = re.sub(r'<link\s+rel="(icon|apple-touch-icon|manifest)"[^>]*>', "", html)

    # Internal links can't navigate inside an iframe, so hand them to the
    # parent switcher instead of letting them dead-end.
    html = html.replace(
        "</body>",
        """<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href^="/"]');
  if (!a) return;
  e.preventDefault();
  parent.postMessage({ __preview_nav: a.getAttribute('href') }, '*');
});
</script>
</body>""",
    )
    return html


def collect_assets(htmls, css):
    """Find every absolute asset path used anywhere, and inline each ONCE."""
    pat_attr = re.compile(
        r'(?:src|srcset|href)="(/[^"]+\.(?:jpg|jpeg|png|webp|svg|ico|gif))"'
    )
    pat_url = re.compile(r'url\((["\']?)(/[^)"\']+\.(?:jpg|jpeg|png|webp|svg|gif))\1\)')
    paths = set()
    for h in htmls:
        paths.update(pat_attr.findall(h))
        paths.update(m[1] for m in pat_url.findall(h))
    paths.update(m[1] for m in pat_url.findall(css))

    # Where a .jpg and .webp are the same picture, keep only the .webp.
    # Every browser that can open this preview supports WebP, so the
    # <source> wins and the .jpg fallback would just double the file size.
    webps = {p for p in paths if p.endswith(".webp")}
    paths = {
        p
        for p in paths
        if not (
            p.endswith((".jpg", ".jpeg"))
            and p.rsplit(".", 1)[0] + ".webp" in webps
        )
    }

    assets = {}
    for p in sorted(paths):
        uri = data_uri(p)
        if uri:
            assets[p] = uri
    return assets


SHELL = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>heybharat.design — local preview</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:#050505;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  #bar { position:sticky; top:0; z-index:10; display:flex; flex-wrap:wrap;
    gap:6px; align-items:center; padding:10px 14px;
    background:#0d0d0f; border-bottom:1px solid rgba(255,255,255,0.12); }
  #bar b { color:#fff; font-size:12px; letter-spacing:.04em; margin-right:10px;
    font-weight:500; }
  #bar b span { color:rgba(255,255,255,0.4); font-weight:400; }
  button { font:inherit; font-size:12px; padding:5px 11px; cursor:pointer;
    color:rgba(255,255,255,0.62); background:transparent; border-radius:999px;
    border:1px solid rgba(255,255,255,0.16); transition:all .15s ease; }
  button:hover { color:#fff; border-color:rgba(255,255,255,0.4); }
  button.on { background:#fff; color:#000; border-color:#fff; }
  #frame { width:100%; height:calc(100% - 47px); border:0; display:block;
    background:#050505; }
</style>
</head>
<body>
  <div id="bar">
    <b>preview <span>&mdash; heybharat.design</span></b>
    <span id="tabs" style="display:contents"></span>
  </div>
  <iframe id="frame" title="page preview"></iframe>

<script id="d-pages"  type="application/json">__PAGES__</script>
<script id="d-assets" type="application/json">__ASSETS__</script>
<script id="d-css"    type="application/json">__CSS__</script>
<script id="d-layout" type="application/json">__LAYOUTJS__</script>
<script id="d-main"   type="application/json">__MAINJS__</script>
<script>
  var J = function (id) { return JSON.parse(document.getElementById(id).textContent); };
  var PAGES  = J('d-pages');
  var ASSETS = J('d-assets');
  var CSS    = J('d-css');
  var LAYOUT = J('d-layout');
  var MAIN   = J('d-main');

  // Longest paths first, so /logos/a.svg never gets clipped by a shorter key.
  var KEYS = Object.keys(ASSETS).sort(function (a, b) { return b.length - a.length; });

  var frame = document.getElementById('frame');
  var tabs  = document.getElementById('tabs');
  var btns  = [];
  var built = {};

  function resolve(html) {
    // CSS and JS live once in this file; splice them in per page.
    html = html.replace(/<link\s+rel="stylesheet"\s+href="\/style\.css"\s*\/?>/,
                        '<style>' + CSS + '</style>');
    var CLOSE = '<' + '/script>';
    html = html.replace('<script src="/layout.js">' + CLOSE,
                        '<script>' + LAYOUT + CLOSE);
    html = html.replace('<script src="/main.js">' + CLOSE,
                        '<script>' + MAIN + CLOSE);
    // Swap every asset path for its stored data: URI.
    for (var i = 0; i < KEYS.length; i++) {
      html = html.split(KEYS[i]).join(ASSETS[KEYS[i]]);
    }
    return html;
  }

  function show(i) {
    if (!built[i]) built[i] = resolve(PAGES[i].html);
    frame.srcdoc = built[i];
    btns.forEach(function (b, n) { b.className = n === i ? 'on' : ''; });
  }

  PAGES.forEach(function (p, i) {
    var b = document.createElement('button');
    b.textContent = p.label;
    b.onclick = function () { show(i); };
    tabs.appendChild(b);
    btns.push(b);
  });

  // Links clicked inside a page jump to that page's tab.
  addEventListener('message', function (e) {
    var to = e.data && e.data.__preview_nav;
    if (!to) return;
    for (var i = 0; i < PAGES.length; i++) {
      if (PAGES[i].route === to) return show(i);
    }
  });

  show(0);
</script>
</body>
</html>"""


def main():
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    layout_js = (ROOT / "layout.js").read_text(encoding="utf-8")
    main_js = (ROOT / "main.js").read_text(encoding="utf-8")

    pages, missing = [], []
    for label, rel in PAGES:
        if not (ROOT / rel).is_file():
            missing.append(rel)
            continue
        pages.append(
            {
                "label": label,
                "route": "/" + rel.replace("index.html", ""),
                "html": build_page(rel),
            }
        )

    assets = collect_assets([p["html"] for p in pages], css)

    def dump(obj):
        return json.dumps(obj).replace("</script>", "<\\/script>")

    shell = SHELL
    shell = shell.replace("__PAGES__", dump(pages))
    shell = shell.replace("__ASSETS__", dump(assets))
    shell = shell.replace("__CSS__", dump(css))
    shell = shell.replace("__LAYOUTJS__", dump(layout_js))
    shell = shell.replace("__MAINJS__", dump(main_js))
    OUT.write_text(shell, encoding="utf-8")

    mb = OUT.stat().st_size / 1_048_576
    print(f"built {OUT.name} — {len(pages)} pages, {mb:.1f} MB")
    print(f"inlined {len(assets)} assets, skipped {len(_asset_cache) - len(assets)} (over cap or absent)")
    if missing:
        print("WARNING — page listed in PAGES but not found: " + ", ".join(missing))


if __name__ == "__main__":
    main()
