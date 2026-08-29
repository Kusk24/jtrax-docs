# Training our own chess opponents

**Date:** 2026-08-29 · **Repos:** `jtrax-ai` (new, `Kusk24/jtrax-ai`, private)
· **Status:** first training run in progress

The Play screen will offer three opponents instead of one: Stockfish, plus two
chess models trained by us from random weights. Students pick a difficulty.

## Why

Stockfish is superhuman and cannot play badly in a believable way — dialled
down it plays perfectly and then blunders at random, which reads as a computer
to a child. See [[playing-chess-in-the-portals]] for the current setup.

The academy also wanted an AI component that is genuinely ours rather than only
calling someone else's model. Training from scratch answers both.

## What is being trained

`ckpt_iter_0.pt` from `adamkarvonen/chess_llm_30_checkpoints` — a nanoGPT with
**random weights**, not a pretrained model:

```
n_layer 8 · n_head 8 · n_embd 512 · block_size 1023 · vocab_size 32
25.73M parameters · iter_num 0 · val_loss 3.5795
```

It is a **character-level language model over PGN text**, so it reads chess as
`;1.e4 e5 2.Nf3` and predicts the next character. Nobody encodes the rules —
tracking the board is simply the only way to predict well, so the rules emerge.
Vocabulary is exactly 32 characters: `' #+-.0123456789;=BKNOQRabcdefghx'`.

val_loss 3.5795 is essentially `ln(32) = 3.47`, i.e. uniform guessing. The
starting point knows nothing at all.

## Two models, one architecture

Only the training data differs. That is what makes them feel different to play
against, rather than one being a worse version of the other.

| | `jtrax-strong` | `jtrax-novice` |
|---|---|---|
| Lichess band (both players) | 2000–2800 | 800–1200 |
| Corpus | `data/strong_train.txt` | `data/novice_train.txt` |
| Games | 1,000,000 + 10,000 held out | same |
| Expected Elo | ~1400–1600 | ~700–1000 |

Corpus size was chosen from the ratio, not by feel: 40,000 iterations at
98,208 tokens each is 3.93B tokens, and 420.7M tokens of corpus gives **9.3
passes** — enough to learn, not enough to memorise. An earlier 200k-game corpus
would have meant 39 passes.

## Measured so far

| | legal-move rate |
|---|---|
| `ckpt_iter_0` (starting point) | **0.000** |
| Karvonen, same architecture, iter 20,000 | 0.940 |
| Karvonen, same architecture, iter 40,000 | 0.960 |
| `lichess_6layers` (1.3M, fully trained) | 0.848 |

The 1.3M model losing to a 25M model trained 30× less is a capacity result, and
it is why the 6-layer was rejected as the training target.

## Maia-2 is the benchmark, not the product

Maia-2 (23.3M params, 338M games) scores **0.5311 move-match** and is kept only
as a reference line — no Maia code runs in training. It gives results a scale to
sit on: "0.41" means nothing alone, "0.28 → 0.41 where state of the art is
0.531" is a result. Its ONNX export was verified early (2.34e-05 drift vs
PyTorch), which proved browser serving works before any GPU time was spent.

Maia-2 has **no published Elo** — it is rating-conditioned, with 11 buckets from
`<1100` to `2000+`, and its papers report move-match rather than strength.

## Maia-2's Elo — measured 2026-08-29

Not published anywhere, so it was measured with `step6_elo.py`. At its 1500
dial, against calibrated Stockfish rungs: 6.5/12 vs `UCI_Elo` 1320 and 4.5/12
vs 1600, giving **~1430**. The rating conditioning is well calibrated, and it
gives `jtrax-strong` a target to aim at.

## Pipeline

| Script | Does |
|---|---|
| `step3_probe.py` | self-play games, legal-move rate |
| `step3b_sweep.py` | probe published checkpoints to choose a base |
| `step4_data.py` | stream a Lichess month, filter by band, write PGN text |
| `step5_train.py` | the training loop (Kaggle T4, fp16, ~4–5 h) |
| `step6_elo.py` | play Stockfish at fixed strengths, derive Elo |

Two things worth remembering from building it:

- **`step4_data.py` streams and never holds the archive.** Monthly Lichess files
  are ~30 GB compressed / ~300 GB open; it decompresses 4 MB at a time, keeps
  what matches, and stops early. It also **resumes on a dropped connection** via
  an HTTP `Range` header — the first 1M-game attempt died with a broken pipe
  partway through.
- **Stockfish's `UCI_Elo` floor is 1320**, too strong to measure the novice
  model. Below that `step6_elo.py` falls back to `Skill Level`, whose Elo
  equivalents are community estimates — those results are labelled `(approx)`
  because they are.

## Decisions made along the way

- **Train from scratch, not fine-tune.** Fine-tuning `ckpt_iter_100000`
  (already 0.962) would cost 1 hour instead of 5 and reach ~0.97 — but the
  before/after would be 0.962 → 0.97, which demonstrates nothing, and the model
  would mostly be someone else's. 0.000 → ~0.96 is visible and ours.
- **Two data bands, not two architectures.** A second architecture (Leela, or a
  board-based net) costs a whole second pipeline for a difference no player can
  perceive — architecture is invisible at the board. Different training data is
  perceptible. A text-GPT vs board-net comparison remains interesting as
  *research*, and Maia-2 beats Leela for it: PyTorch, pip-installable, and a
  published number to compare against.
- **Kaggle for training, Mac for everything else.** Free tier: 30 GPU-h/week,
  12 h/session. Both runs together are ~10 h. Data prep, probing and Elo all run
  locally.

## Follow-ups

- [ ] Finish `jtrax-strong` run, probe the saved checkpoints for a learning curve
- [ ] Build `novice_` corpus and run the second training
- [ ] Measure both with `step6_elo.py`, and move-match against Maia-2's 0.5311
- [ ] Quantise to int8 (~25 MB) and export ONNX for the browser
- [ ] Wire three difficulty options into the Play screen

## Not in scope

Students are children: their linked Lichess games never enter this repo, a
Kaggle notebook, or any public dataset. Training uses public Lichess dumps only.

Related: [[playing-chess-in-the-portals]] ·
`research/fine-tuning-a-model-for-jtrax.md` · [[jtrax-free-tier-no-card]]

Tags: #feature #ai #chess
