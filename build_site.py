#!/usr/bin/env python3
"""Build the two MkDocs projects into one GitHub Pages artifact."""
from __future__ import annotations

import shutil
import subprocess
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
SHARED_ASSETS = ROOT / "shared" / "assets"
PRIVATE_PATTERNS = (
    rb"(?:^|[\s('])(raw/[A-Za-z._-])",
    rb"source-review-ledger",
    rb"entity-registry",
    rb"/Users/",
    rb"BEGIN (?:OPENSSH )?PRIVATE KEY",
)


def run() -> None:
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir()
    for locale in ("en", "zh"):
        subprocess.run(
            ["mkdocs", "build", "--strict", "-f", str(ROOT / f"mkdocs.{locale}.yml"), "-d", str(SITE / locale)],
            cwd=ROOT,
            check=True,
        )
        shutil.copytree(SHARED_ASSETS, SITE / locale / "assets", dirs_exist_ok=True)
    (SITE / ".nojekyll").write_text("", encoding="utf-8")
    (SITE / "index.html").write_text(root_router(), encoding="utf-8")
    scan_public_output()


def scan_public_output() -> None:
    for path in SITE.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(SITE)
        if "assets" in relative.parts and path.name not in {"course.js", "visualizations.js", "course.css"}:
            continue  # Third-party theme bundles are pinned dependencies, not exported repository content.
        data = path.read_bytes()
        for pattern in PRIVATE_PATTERNS:
            if re.search(pattern, data, re.I):
                raise RuntimeError(f"public artifact contains private material in {relative}")


def root_router() -> str:
    return """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quant Finance, Visually</title></head><body>
<p><a href="en/">English</a> · <a href="zh/">简体中文</a></p>
<script>
let saved = null;
try { saved = localStorage.getItem('quant-wiki-locale:v1'); } catch (_) {}
const locale = saved === 'zh' || saved === 'en'
  ? saved
  : ((navigator.languages || [navigator.language]).some(x => /^zh\\b/i.test(x)) ? 'zh' : 'en');
location.replace(locale + '/');
</script><noscript><p>Please choose a language / 请选择语言。</p></noscript>
</body></html>"""


if __name__ == "__main__":
    run()
