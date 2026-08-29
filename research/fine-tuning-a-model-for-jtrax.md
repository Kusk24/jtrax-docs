# Fine-tuning a model for JTrax — options and constraints

**Date:** 2026-08-23 · **Updated:** 2026-08-29 · **Status:** superseded as a
plan — see [[training-our-own-chess-opponents]]

**What actually happened:** Maia-2 was *not* chosen as the training target. It
is kept as a benchmark (0.5311 move-match, and **~1430 Elo measured 2026-08-29**
against Stockfish at its 1500 dial). The model being trained is a 25.7M
character-level GPT over PGN text, from random weights. Reasons in the feature
note; this note is kept for the option comparison that led there.

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

### Which Maia — Maia-2 (decided 2026-08-27)

There are three and they are not interchangeable:

| | Fine-tuning | Serving |
|---|---|---|
| **Maia-1** (`maia-chess`) | TensorFlow + `pgn-extract` + `trainingdata-tool`, 2020-era | proven ONNX (`maia_kdd_1100…1900`) in maia-platform-frontend |
| **Maia-2** ✅ | `pip install maia2`, documented `train.run(cfg)`, plain PyTorch | verified below |
| **Maia-3** (5M/23M/79M) | **no training code published** — inference only | undocumented |

Maia-2 wins on one property that matters specifically here: it is
**rating-conditioned at inference time**, not at training time. Signature, read
from the installed package (`maia2/main.py`), not from docs:

```
MAIA2Model.forward(boards, elos_self, elos_oppo)
  boards     float32 (batch, 18, 8, 8)      # input_channels: 18
  elos_self  int64 bucket index             # 11 buckets, '<1100' … '2000+'
  elos_oppo  int64 bucket index
  -> (logits_maia, logits_side_info, logits_value)
```

So **one file serves every student level** — pass the pupil's band as
`elos_self`. Maia-1 would mean shipping nine nets and choosing per student.

### The ONNX gate — passed (verified 2026-08-27)

maia2's docs never mention ONNX, and the whole free-serving plan depended on it,
so it was checked before any training time was spent. Scripts live in
`jtrax-ai/` (`step1_baseline.py`, `step2_export_onnx.py`).

| Check | Result |
|---|---|
| Install (conda py3.12, maia2 0.11.0, torch 2.8.0) | ok — system py3.13 is too new, env is required |
| Baseline move-match, stock model, bundled example set, MPS | **0.5311** |
| Model size | 23.3M parameters |
| `torch.onnx.export` opset 17 | **ok** |
| onnxruntime load + run | ok — policy shape `(1, 1880)` |
| Max output drift vs PyTorch | **2.34e-05** |
| Exported file size | **93.2 MB fp32** |

The drift number is the one that mattered: an export that runs but disagrees
with PyTorch is worse than one that fails, because nothing downstream notices
and the browser plays a different game from the one that was evaluated.

**Open item:** 93 MB is a first-load download for every student. Quantise to
int8 (~25 MB expected) before shipping to the Play screen.

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

## The account has AWS — what that actually changes (verified 2026-08-23)

Checked against the real account (`730335541742`, us-east-1), not assumed:

| Check | Result |
|---|---|
| Credentials work | yes — `sts get-caller-identity` returns the IAM user |
| EC2 **On-Demand** G/VT vCPU quota | **0** |
| EC2 **Spot** G/VT vCPU quota | **0** |
| SageMaker `ml.g4dn.xlarge` (training / spot / notebook / processing) | **0** across the board |
| Bedrock | reachable — foundation models list fine |

**Having an AWS account is not the same as being able to train on it.** Every
GPU quota on this account is zero, which is the default for accounts that have
never used GPUs. Nothing can be launched until a Service Quotas increase is
requested and approved (free, but hours-to-days, and AWS can decline for
accounts with no billing history). Request *both* "Running On-Demand G and VT
instances" and the Spot equivalent, in vCPUs — a `g4dn.xlarge` is 4 vCPUs.

Cost, once unblocked: `g4dn.xlarge` (1×T4, 16 GB) is **~$0.526/hour on demand
≈ $384/month if left running**. GPU instances are **not** in the AWS free tier.
Training runs are cheap (hours → a few dollars); a 24/7 inference server is the
line item that matters.

## Infra — what is actually needed (free + card-free rule applies)

| Option | Card? | What you get | Verdict |
|---|---|---|---|
| **Local (this Mac, M2 16 GB)** | no | MLX LoRA: 1–7B fine-tunes, ~20–30 min for small sets | Best for iteration; private data stays local |
| **Kaggle** | no (phone verify) | 30 GPU-h/week, P100/T4 16 GB, 9-h sessions, background exec | Best free option for longer runs. Notebooks public by default — no student data |
| **Colab free** | no | T4 16 GB, session timeouts | Fine for Unsloth QLoRA experiments |
| **AWS (this account)** | already on file | GPU quota currently 0 — needs an increase first; ~$0.53/h for a T4 once unblocked | Worth it only for the LLM path (serving). Not needed for Maia |
| GCP / Vertex | yes | managed everything | Not needed at this scale |

**Privacy note:** students are children. Training on their games/data stays
local or in private storage — never a public Kaggle notebook/dataset.

## The real bottleneck

Not compute — **the dataset and the eval set**. Build the held-out
evaluation first, before any training run, or "did it improve?" is
unanswerable. For Maia: held-out games at the target rating band.

## Suggested path

1. ~~Prototype locally~~ **done 2026-08-27** — baseline 0.5311 and the ONNX
   export both verified; see the gate table above.
2. **Next:** build the held-out eval set from games at the bands JCA teaches,
   and play-test stock Maia-2 vs. Stockfish-dialed-down before training
   anything. If stock Maia does not already feel more human to a child, a
   fine-tune will not rescue it.
3. Fine-tune on Kaggle (public Lichess data) or locally (student data).
   Kaggle notes: private notebooks only (students are children); 2×T4 costs
   the same quota as the P100 for double the compute; never download a raw
   monthly Lichess dump (~30 GB zst / ~300 GB open) — stream-filter to the
   target band first and save that as a private Dataset; checkpoint every
   epoch to `/kaggle/working/`.
4. Quantise to int8, then serve in-browser next to the existing Stockfish
   WASM; A/B in the student portal's Play screen.
5. Only revisit the LLM path when there is a concrete feature that needs
   language — and a serving budget. That is where AWS earns its keep: it is
   the one option here that can *serve* a fine-tuned LLM at all. Request the
   GPU quota increase now regardless, so it is approved before it is needed.

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


## Maia-2 Elo — measured 2026-08-29

The papers report move-match, never Elo, so it was measured directly with
`jtrax-ai/step6_elo.py` against Stockfish 18 at calibrated strengths:

| opponent | score | performance |
|---|---|---|
| `UCI_Elo` 1320 | 6.5/12 | 1349 |
| `UCI_Elo` 1600 | 4.5/12 | 1511 |
| **estimate** | | **~1430** |

Set to its 1500 dial it plays ~1430, so the rating conditioning is well
calibrated.

**A trap found while measuring.** Stockfish's `UCI_Elo` floor is 1320, so
weaker rungs used `Skill Level` with community Elo equivalents. Those are
badly wrong: Maia-2 lost 1.5/12 to "Skill 3 (~1000)" while drawing 6.5/12
against a calibrated 1320. Averaging them in reported 1027 for a ~1430 player.
`step6_elo.py` now uses calibrated rungs only, and flags any estimate that
rests on Skill Level.
