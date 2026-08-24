# Fine-tuning a model for JTrax — options and constraints

**Date:** 2026-08-23 · **Status:** research, no decision yet

The academy wants its own fine-tuned model in the product instead of only
using other people's. Two very different candidates for "the AI in this
project", and the choice decides everything downstream.

## Candidate A — the chess opponent (recommended first)

Today students play Stockfish (superhuman engine, dialed down). The
fine-tunable alternative is **Maia** (maiachess.com, CSSLab) — a neural
network trained to *predict human moves* rather than win, with checkpoints
targeted at each Lichess rating band (1100–1900; Maia-3 is current). For a
children's academy this is the genuinely differentiating path:

- Fine-tune a Maia checkpoint on games from a rating band — or on **our own
  students' Lichess games**, which JTrax already links to accounts — to get
  opponents that play like the students' peers, or like a specific level.
- **Evaluation is objective and easy**: move-matching accuracy on held-out
  human games at the target rating, plus Elo from automated matches vs known
  engine levels. No judges, no subjectivity.
- **Serving fits the free tier**: these policy nets are megabytes, runnable
  in the browser (ONNX Runtime Web / WASM) exactly like the existing
  Stockfish WASM — zero server cost, works in the same PlayShell.

## Candidate B — a fine-tuned small LLM (tutor chat, form OCR)

LoRA/QLoRA on a small open model (Qwen / Gemma / Llama family, 1–7B).
Training is cheap and easy in 2026 (Unsloth on a free T4 handles 7–12B
QLoRA). The two hard parts are not training:

1. **Evaluation** — needs a curated eval set and usually LLM-as-judge;
   far mushier than the chess path.
2. **Serving** — there is no free-and-card-free home for LLM inference.
   Render free (512 MB) cannot run one; every serious host wants a card.
   A fine-tuned LLM that cannot be deployed is a notebook artifact.

If the use-case is the tournament-poster / registration-form extraction,
an API vision model called on demand is more sensible than fine-tuning.

## Infra — what is actually needed (free + card-free rule applies)

| Option | Card? | What you get | Verdict |
|---|---|---|---|
| **Local (this Mac, M2 16 GB)** | no | MLX LoRA: 1–7B fine-tunes, ~20–30 min for small sets | Best for iteration; private data stays local |
| **Kaggle** | no (phone verify) | 30 GPU-h/week, P100/T4 16 GB, 9-h sessions, background exec | Best free option for longer runs. Notebooks public by default — no student data |
| **Colab free** | no | T4 16 GB, session timeouts | Fine for Unsloth QLoRA experiments |
| AWS / GCP / SageMaker / Vertex | **yes** | managed everything | Not needed at this scale; violates the card-free rule |

**Privacy note:** students are children. Training on their games/data stays
local or in private storage — never a public Kaggle notebook/dataset.

## The real bottleneck

Not compute — **the dataset and the eval set**. Build the held-out
evaluation first, before any training run, or "did it improve?" is
unanswerable. For Maia: held-out games at the target rating band.

## Suggested path

1. Prototype locally: run Maia checkpoints vs. move-match on Lichess games
   at the levels the academy teaches; confirm the "plays like a kid at
   level X" feel beats Stockfish-dialed-down in play-testing.
2. Fine-tune on Kaggle (public data) or locally (student data).
3. Serve in-browser next to the existing Stockfish WASM; A/B in the
   student portal's Play screen.
4. Only revisit the LLM path when there is a concrete feature that needs
   language — and a serving budget.

## Sources

- maiachess.com · github.com/CSSLab/maia-chess (KDD 2020; Maia-2 NeurIPS
  2024; Maia-3 2026)
- Unsloth/QLoRA free-tier guides (2026): pub.towardsai.net, codersera.com,
  pockit.tools
- Kaggle quotas: kaggle.com/general/108481, resourify.com/resources/kaggle
- MLX LoRA on Apple Silicon: kdnuggets.com, github.com/ARahim3/mlx-tune,
  insiderllm.com

Related: [[jtrax-free-tier-no-card]] rule ·
`decisions/0005-render-and-turso-for-free-hosting.md`

Tags: #research #ai #chess
