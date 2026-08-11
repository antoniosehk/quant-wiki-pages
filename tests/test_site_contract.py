import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_bilingual_mkdocs_projects_share_public_paths():
    english = (ROOT / "mkdocs.en.yml").read_text(encoding="utf-8")
    chinese = (ROOT / "mkdocs.zh.yml").read_text(encoding="utf-8")
    assert "/quant-wiki-pages/en/" in english
    assert "/quant-wiki-pages/zh/" in chinese
    assert "language: en" in english and "language: zh" in chinese


def test_visual_registry_covers_at_least_the_core_curriculum():
    source = (ROOT / "shared/assets/javascripts/visualizations.js").read_text(encoding="utf-8")
    ids = set(re.findall(r'^  "([a-z0-9-]+)": \[', source, re.MULTILINE))
    assert len(ids) >= 34
    assert {"expectation-explorer", "black-scholes-explorer", "efficient-frontier", "parameter-heatmap"} <= ids


def test_language_router_prefers_saved_choice_before_browser_detection():
    from build_site import root_router

    router = root_router()
    assert "saved === 'zh' || saved === 'en'" in router
    assert "navigator.languages" in router
    assert "location.replace(locale + '/')" in router
    assert "\x08" not in router
    assert "/^zh\\b/i" in router


def test_public_shell_contains_no_private_repository_paths():
    included = []
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if path.is_file() and ({"shared", "docs", "overrides", ".github"} & set(relative.parts)) and not ({".venv", "site", "tests"} & set(relative.parts)) and path.suffix in {".md", ".yml", ".js", ".css", ".py"}:
            included.append(path.read_text(encoding="utf-8"))
    text = "\n".join(included)
    forbidden = (r"(?:^|[\s('])raw/[A-Za-z._-]", "source-review-ledger", "entity-registry", "/Users/", "BEGIN PRIVATE KEY", "BEGIN OPENSSH PRIVATE KEY")
    assert not [marker for marker in forbidden if re.search(marker, text, re.I)]


def test_capstone_is_guided_instead_of_a_long_questionnaire():
    english = (ROOT / "docs/en/activities.md").read_text(encoding="utf-8")
    chinese = (ROOT / "docs/zh/activities.md").read_text(encoding="utf-8")
    assert "textarea" not in english + chinese
    assert "导出这一页结论" not in english + chinese
    assert 'class="quant-guided-activity"' in english
    assert "不用填写长问卷" in chinese
