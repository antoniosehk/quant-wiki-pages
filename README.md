# Quant Wiki Pages

Public, mobile-first English and Simplified Chinese beginner course exported from the private `antoniosehk/quant` repository.

This repository intentionally contains no raw transcripts, source notebooks, source-review ledger, or credentials. Course Markdown is synchronized by the private repository's `scripts/course_export.py`; Git operations remain manual.

## Build

```bash
uv sync
uv run python build_site.py
uv run pytest
```

The combined static site is written to `site/`, with English under `/en/` and Simplified Chinese under `/zh/`. Every interactive lesson asks for a prediction before revealing the graph, includes four numeric presets with worked substitutions, and stores completion, predictions, interaction state, and Capstone answers locally. Learners can export or import a versioned progress JSON file; the site uploads no learning data.

The browser suite checks a 390 px viewport, bilingual shared progress, Capstone persistence, and known numerical values for expected value, present value, sampling error, risk-neutral probability, and Black–Scholes pricing. CI installs pinned Chromium before running it.
