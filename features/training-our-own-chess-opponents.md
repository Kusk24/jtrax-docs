# Training our own chess opponents

**Date:** 2026-08-29 · **Updated:** 2026-09-05 · **Repos:** `jtrax-ai`
(`Kusk24/jtrax-ai`, private) · **Status:** all three tiers
trained, measured and
exported to ONNX. Not yet wired into the Play screen.

The Play screen will offer three opponents instead of one. Students pick a
difficulty; each tier is a different model, not the same engine dialled down.

| Tier | Model | Status |
|---|---|---|
| **expert** | Stockfish | already in the app |
| **strong** | Maia-2, fine-tuned by us on 2000–2800 games | **done** — `maia2_ft_20000.pt` |
| **novice** | nanoGPT trained by us from random weights | **done** — `ckpt_40000.pt`, ~520 Elo |

## Why

Stockfish is superhuman and cannot play badly in a believable way — dialled
down it plays perfectly and then blunders at random, which reads as a computer
to a child. See [[playing-chess-in-the-portals]] for the current setup.

The academy also wanted an AI component that is genuinely ours rather than only
calling someone else's model. Two of the three tiers are now models we trained.

## The plan changed on 2026-09-02

The original plan was **two** GPTs of the same architecture, differing only in
training data: one on 2000–2800 games for "strong", one on 800–1200 for
"novice". The 800–1200 run happened; the 2000–2800 GPT did not.

**Why it was dropped.** The novice run showed what a 25.7M searchless
character-level GPT actually reaches on free Kaggle quota: about 520 Elo after
40,000 iterations. Karvonen needed **600,000** iterations of the same
architecture to reach ~1300. A "strong" tier built the same way was never going
to be strong — it would have been a second novice on different data.

Fine-tuning Maia-2 gets there instead, because it starts at ~1300–1450 rather
than at zero.

## The novice model

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

Corpus: `data/novice_train.txt`, 1,000,000 Lichess games where **both** players
were rated 800–1200, plus 10,000 held out. 310,236,172 tokens. At 98,208
tokens per iteration, 40,000 iterations is 12.7 passes — enough to learn,
not enough to memorise.

### Measured curve

Legal-move rate is self-play (`step3_probe.py`, 20 games). Elo is 12 games per
rung against Stockfish (`step6_elo.py`).

| | val loss | legal | legal 1st try | avg plies | Elo | illegal retried |
|---|---|---|---|---|---|---|
| `ckpt_iter_0` | 3.5795 | **0.000** | — | — | — | — |
| `ckpt_4000` | — | 0.8085 | 0.9202 | 38.9 | 282 | 438 |
| `ckpt_8000` | 0.4339 | 0.8837 | 0.9546 | 54.0 | — | — |
| `ckpt_15999` | — | 0.9109 | 0.9600 | 56.2 | 345 | 263 |
| `ckpt_29999` | 0.3928 | 0.9163 | 0.9680 | 65.7 | 383 | 266 |
| **`ckpt_40000`** | 0.3908 | **0.9363** | **0.9728** | 62.5 | **~520** | **190** |

**Validation loss is a bad proxy for playing strength — in both directions.**

- 16,000 → 30,000: loss fell **0.041**, legal rate gained 0.005, Elo moved 38.
  Loss improved and play did not.
- 30,000 → 40,000: loss was **flat** (0.3928 → 0.3908, inside its own noise),
  yet legal rate gained 0.020, retries fell 29%, and the model scored against a
  calibrated rung for the first time. Play improved and loss did not.

Read the probe and the Elo ladder, not the training curve.

For reference, the same architecture published by Karvonen reaches 0.940 legal
at iteration 20,000 and 0.960 at 40,000. Ours hits 0.936 at 40,000 — close, and
the gap is expected given the corpus is restricted to 800–1200-rated games.

### Reading the Elo below Stockfish's floor

Stockfish's `UCI_Elo` floor is **1320**, so there is very little calibrated to
play against down here. The one solid data point at 40,000:

```
vs UCI_Elo 1320    0.5/12    -> performance 775
```

That is the **first score against a calibrated rung** — `ckpt_15999` and
`ckpt_29999` were both 0/12 there. Below the floor `step6_elo.py` falls back to
`Skill Level`, whose Elo equivalents are community estimates and demonstrably
wrong: at 40,000 they gave 0.5/12 against "Skill 6 ≈ 1200" but 0/12 against
"Skill 3 ≈ 1000", which cannot both be true. So "520" is a ballpark, but the
direction is corroborated by three independent measurements — legal rate,
retry count, and that calibrated half-point.

That is the right strength for the tier. A beginner child is roughly 400–800.

### Why training stopped at 40,000

**Not** because it converged — 30,000 → 40,000 gained four times what
16,000 → 30,000 did, and more iterations would likely keep helping.

It stopped because **520 is the correct strength for a novice opponent.**
Training further moves the model away from its job. 0.973 first-try legality
already means about one retry in 37 in the Play screen, which is invisible.

## The strong model — Maia-2 fine-tuned

Maia-2 is the only Maia that can be fine-tuned: Maia-1 needs the dead lc0 /
TensorFlow toolchain and Maia-3 ships inference code only. Two things about it
were found by reading `site-packages/maia2/` rather than the docs:

- **`maia2.train.run()` will not take the released checkpoint.** It is a
  *resume* mechanism that validates `training_metadata`, `checkpoint_year/month`
  and a source sha256, none of which the public `.pt` carries. So
  `step7_maia_finetune.py` is a plain PyTorch loop that loads the released
  weights and trains them.
- **`preprocessing()` takes a FEN**, which meant the existing PGN-text corpus
  worked and no 30 GB monthly archive download was needed — replaying games with
  python-chess produces exactly the tuples the model wants.

Two details that silently corrupt training if missed, both in
`jtrax-ai/step7_maia_finetune.py`:

- `preprocessing()` **mirrors the board when Black is to move**, so the target
  move has to be mirrored too. Miss it and half the training data teaches
  nonsense, with nothing in the logs to show it.
- **Loss is masked to legal moves**, matching how Maia-2 ranks at inference.
  Without the mask, capacity goes into learning that illegal moves are unlikely
  — a question it is never asked at inference.

Elo conditioning: `step4_data.py` filtered by band but did not record per-game
ratings, so every position is labelled with the band midpoint — bucket 10
(`>=2000`) for the 2000–2800 corpus.

### Result

Held-out top-1 move-match on `data/strong_heldout.txt` (10,000 games at
2000–2800, never trained on), `step8_maia_eval.py`:

| | move-match |
|---|---|
| stock Maia-2 | 0.5089 |
| `maia2_ft_20000` | **0.5256** (+0.0167) |

Reproduced at both 30,000 and 50,000 positions.

**`step8_maia_eval.py` exists because `step7` never used the held-out set** — it
reported move-match on training batches, which shows the model learned the data
it saw, not that it generalises. The two are not comparable for a second reason:
`step7`'s figure was computed with dropout active.

## Maia-2's own Elo, and how noisy it is

Not published anywhere — Maia's papers report move-match, and the model is
rating-conditioned across 11 buckets from `<1100` to `2000+`. Measured with
`step6_elo.py` at its 1500 dial it came out **~1430 on 2026-08-29 and 1291 on a
re-run with identical settings**. Twelve games per rung gives roughly ±150, so
the honest statement is "1300–1450", and any single number from this harness
carries that error bar. See `research/fine-tuning-a-model-for-jtrax.md`.

## Pipeline

| Script | Does |
|---|---|
| `step1_baseline.py` | Maia-2 reference move-match — 0.5311 on its bundled set |
| `step2_export_onnx.py` | ONNX gate: 93.2 MB fp32, 2.34e-05 drift vs PyTorch |
| `step3_probe.py` | self-play games, legal-move rate |
| `step3b_sweep.py` | probe published checkpoints to choose a base |
| `step4_data.py` | stream a Lichess month, filter by band, write PGN text |
| `step5_train.py` | the nanoGPT training loop |
| `step6_elo.py` | play Stockfish at fixed strengths, derive Elo |
| `step7_maia_finetune.py` | fine-tune Maia-2 on the strong corpus |
| `step8_maia_eval.py` | held-out move-match, stock vs fine-tuned |

`step2` ran before any GPU time was spent, which proved browser serving works
before it was worth training anything.

**`step4_data.py` streams and never holds the archive.** Monthly Lichess files
are ~30 GB compressed / ~300 GB open; it decompresses 4 MB at a time, keeps what
matches, and stops early. It also **resumes on a dropped connection** via an
HTTP `Range` header — the first 1M-game attempt died with a broken pipe partway
through.

## Two bugs in our own code, both found by measuring

- **bf16 on a T4 is emulated**, and `torch.cuda.is_bf16_supported()` returns
  `True` anyway. Cost about 6× in training throughput before it was caught. Full
  write-up: [[bf16-on-a-t4-is-emulated]].
- **Checkpoints were named by the 0-based loop index**, so `--iters 40000`
  produced `ckpt_39999.pt`, and `iter_num` stored the loop index rather than the
  count completed — so every resume silently redid one iteration.
  `step5_train.py:254` now names by iterations *completed*.

Running Kaggle sessions back to back has its own set of traps; those are in
[[resuming-a-kaggle-training-run]].

## Serving: the quantisation is not the same for both models

Exported 2026-09-05 with `step9_export_novice_onnx.py` and
`step10_export_strong_onnx.py`. Both gate on a **behavioural** metric rather
than numeric drift — drift can look fine while the argmax flips, and a flipped
argmax is a different move.

**Novice** — gate is self-play legality, comparable to `step3_probe.py`:

| | size | legal-move rate |
|---|---|---|
| PyTorch `ckpt_40000` | — | 0.9363 |
| ONNX fp32 | 103.1 MB | agreement 1.0000, drift 9.33e-05 |
| **ONNX int8** | **26.0 MB** | **0.9449** |

int8 costs nothing measurable, so the novice ships at 26 MB.

**Strong** — gate is held-out move-match, same metric as `step8_maia_eval.py`,
every candidate scored on the *same* 8,192 positions:

| | size | move-match |
|---|---|---|
| fp32 | 93.2 MB | 0.5387 |
| **float16** | **46.7 MB** | **0.5397**  (+0.0010) |
| uint8 | 23.5 MB | 0.5299  (−0.0088) |
| int8 | 23.5 MB | 0.5168  (−0.0219) |

**Maia-2 does not survive 8-bit.** The fine-tune is worth +0.0167, so int8 gives
back more than it bought and uint8 gives back half. float16 is lossless here, so
the strong tier ships at 47 MB.

A measurement trap worth remembering: the first version of the check scored int8
on 8k positions against the stored 50k reference, and reported the loss as
−0.0088 when it was really −0.0219. **Compare quantised against fp32 on the same
positions**, or sampling noise gets read as quantisation quality.

Serving note: the novice graph has **no KV cache**, so every sampled character
re-runs the whole sequence. Measure it in the Play screen before assuming it is
fast enough.

## Decisions made along the way

- **Train the novice from scratch, not fine-tune.** Fine-tuning
  `ckpt_iter_100000` (already 0.962 legal) would cost 1 hour instead of 5 and
  reach ~0.97 — but the before/after would be 0.962 → 0.97, which demonstrates
  nothing, and the model would mostly be someone else's. 0.000 → 0.916 is
  visible and ours.
- **Fine-tune Maia-2 for the strong tier rather than train a second GPT.** See
  "the plan changed" above. Starting at ~1300 beats starting at zero when the
  budget is 30 GPU-h/week.
- **Not Leela.** Leela is a *search* engine — its rating is whatever thinking
  time you give it, so it has no single Elo, and at `--nodes 1` it is a bare
  policy net. Maia-2 is PyTorch, pip-installable, rating-conditioned, and has a
  published number to compare against.
- **Kaggle for training, Mac for everything else.** Free tier: 30 GPU-h/week,
  12 h/session. Data prep, probing and Elo all run locally.

## Follow-ups

- [ ] A fourth tier at ~1100 costs nothing: Maia-2 is rating-conditioned, so
      `elos_self=1100` fills the gap between novice (520) and strong (~1400)
      with a dropdown entry and no extra model
- [x] Export both models to ONNX and quantise — novice int8 26 MB, strong
      float16 47 MB (see above; int8 is not viable for Maia-2)
- [ ] Wire the three difficulty options into the Play screen
- [x] `jtrax-ai/CLAUDE.md` rewritten 2026-09-05 to match what was built

## Not in scope

Students are children: their linked Lichess games never enter this repo, a
Kaggle notebook, or any public dataset. Training uses public Lichess dumps only.

A .docx report covering all of this for someone outside the repo is generated
from `results/*.json` by `jtrax-ai/tools/make_training_report.py` and lives at
`research/JTrax Chess AI - Training and Evaluation - 2026-09-05.docx`. Regenerate
it rather than editing it, or it drifts from the measurements.

Related: [[playing-chess-in-the-portals]] · [[bf16-on-a-t4-is-emulated]] ·
[[resuming-a-kaggle-training-run]] ·
`research/fine-tuning-a-model-for-jtrax.md`

Tags: #feature #ai #chess
