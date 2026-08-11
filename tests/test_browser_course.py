from __future__ import annotations

import contextlib
import functools
import http.server
import socket
import subprocess
import sys
import threading
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def course_url():
    subprocess.run([sys.executable, "build_site.py"], cwd=ROOT, check=True)
    with contextlib.closing(socket.socket()) as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT / "site")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=5)


def reveal(visual, answer: str = "Increase"):
    visual.get_by_role("button", name=answer, exact=True).click()


def test_mobile_prediction_worked_example_and_shared_progress(page, course_url):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{course_url}/en/demo/")
    visual = page.locator(".quant-visual")
    assert float(visual.locator(".quant-result").evaluate("e => getComputedStyle(e).opacity")) < 0.2
    reveal(visual)
    assert "E[X] = 0.50" in visual.locator("output").inner_text()
    visual.get_by_role("button", name="Example 1 · 10% wins", exact=True).click()
    assert "E[X] = -0.70" in visual.locator("output").inner_text()
    worked = visual.locator(".quant-worked-example").inner_text()
    assert "E[X] = p·gain" in worked and "0.10×2" in worked
    page.get_by_role("button", name="Mark complete", exact=True).click()
    progress = page.evaluate("JSON.parse(localStorage.getItem('quant-wiki-progress:v1'))")
    assert progress["completed"]["preview"] and progress["predictions"]["expectation-explorer"]["correct"] is True
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth") is True
    page.goto(f"{course_url}/zh/demo/")
    assert page.get_by_role("button", name="已完成 ✓", exact=True).is_visible()


def test_representative_formulas_match_known_values(page, course_url):
    page.goto(f"{course_url}/en/lab/")
    expected = {
        "present-value-explorer": "PV = 78.35",
        "sampling-distribution": "SE = 0.141",
        "risk-neutral-tree": "q = 0.563",
        "black-scholes-explorer": "C = 14.23",
    }
    for visual_id, result in expected.items():
        visual = page.locator(f'[data-visualization="{visual_id}"]').first
        reveal(visual, "It depends" if visual_id == "risk-neutral-tree" else ("Decrease" if visual_id in {"present-value-explorer", "sampling-distribution"} else "Increase"))
        assert result in visual.locator("output").inner_text()


def test_guided_capstone_needs_no_typing_and_persists_choices(page, course_url):
    page.goto(f"{course_url}/en/activities/")
    assert page.locator(".quant-guided-activity textarea").count() == 0
    page.get_by_role("button", name="Yes, profitable", exact=True).click()
    assert "55% × $12 − 45% × $10 = $2.10/trade" in page.locator(".quant-calculation").inner_text()
    page.get_by_role("button", name="Cost rises to $2.50 per trade", exact=True).click()
    assert "−$0.40/trade" in page.locator(".quant-guided-finish").inner_text()
    page.reload()
    assert page.get_by_role("button", name="Yes, profitable", exact=True).get_attribute("aria-pressed") == "true"
    assert page.get_by_role("button", name="Cost rises to $2.50 per trade", exact=True).get_attribute("aria-pressed") == "true"
