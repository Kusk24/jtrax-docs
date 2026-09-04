# Resuming a Kaggle training run

**Written:** 2026-09-03 · **Repo:** `jtrax-ai` · **Applies to:** any training
that outlasts Kaggle's 12-hour session cap.

Kaggle's free tier gives 30 GPU-hours a week and kills any session at exactly
**43,200s**. Training that needs longer has to be chained across sessions, and
almost every step of that has a trap. This is the runbook.

## The five things that are not obvious

1. **`/kaggle/working` is wiped at the start of every session.** A checkpoint
   written there survives only as that notebook *version's* Output.
2. **Notebook output and datasets are separate things, and one never becomes the
   other.** Nothing is promoted automatically — not even for the owner. A
   dataset changes only when you upload a new version.
3. **A notebook cannot attach its own output as input.** So you alternate
   between two notebooks: A trains, B resumes from A's output, A resumes from
   B's, and so on.
4. **"Add Input → Notebook" attaches the *latest* version's output**, with no
   picker. Two junk 15-second versions committed after a good 12-hour run will
   hide it — the good output is two versions back and unreachable.
5. **Set the accelerator *before* committing.** `Accelerator: None` runs the
   whole thing on CPU. It consumes no GPU quota, which is the confusing part:
   the limit does not move while 12 hours of wall clock disappear.

## The loop

Per session:

1. Open the notebook that did *not* produce the newest checkpoint
2. **+ Add Input** → filter **Notebook** → the other notebook → **+**
   (it lands under a `NOTEBOOKS` heading, separate from `DATASETS`)
3. **+ Add Input** → **Datasets** → the corpus dataset
   — required; the notebook output has checkpoints and `vendor/` but **no corpus**
4. **Settings → Accelerator → GPU T4 ×2**
5. **Save Version → Save & Run All (Commit)**, then close the tab
6. Confirm three lines in the Logs before walking away:

```
device: cuda
  resumed at iteration N
precision: float16 + grad scaler
```

Any of those wrong → cancel immediately rather than lose a session.
`float32` means the accelerator is not attached. A checkpoint number lower than
expected means the notebook input did not attach.

**Shut down draft sessions.** A commit runs in its own container, so a draft
left open burns quota in parallel for nothing.

## Making the script survive this

`jtrax-ai/step5_train.py` writes to `/kaggle/working` when it detects Kaggle,
and checkpoints every 2,000 iterations — so a killed session costs at most 2,000.

`--auto-resume` searches `--out` and then falls back to `/kaggle/input`, because
`/kaggle/working` is always empty at session start and the flag would otherwise
look like it worked while silently restarting from zero (`step5_train.py:164`).

The notebook wrapper locates every file **by name** rather than by path:

```python
def find(name):
    for root, _, files in os.walk("/kaggle/input"):
        if name in files:
            return os.path.join(root, name)
    raise SystemExit(f"not found anywhere in /kaggle/input: {name}")
```

How deep a dataset nests under `/kaggle/input` depends on how it was uploaded —
one was at `/kaggle/input/datasets/<user>/<name>/`, not the documented
`/kaggle/input/<name>/`. An early version assumed a `vendor/` directory sat
beside `step5_train.py`; in a flatly-uploaded dataset it does not, and the run
died on `shutil.copytree`.

Same idea for picking the checkpoint — take the highest number anywhere in the
inputs, skipping names without one (`ckpt_iter_0.pt` is the random starting
point, and "resuming" from it restarts the run):

```python
def newest_ckpt():
    ...  # max over int(f[5:-3]) for ckpt_*.pt under /kaggle/input
```

With that, sessions 2 and 3 need **zero** code edits — swap the attached
notebook output and commit.

**Print the input tree first.** One `os.walk` at the top of the script means a
missing file is diagnosed in the same 20-second run that failed, instead of
across three.

**Patch by string replace, and assert.** When the `step5_train.py` inside the
dataset is behind the repo, the wrapper patches the copy in `/kaggle/working`.
A bare `str.replace` that matches nothing is a silent no-op — it trains for five
hours without the fix. Use a helper that raises when the target is absent.

## Getting checkpoints onto the Mac

- **A `.pt` *is* a zip archive.** Browsers therefore serve it as `.zip` —
  Chrome as `ckpt_15999.zip`, Safari as `ckpt_8000.pt.zip`. **Rename, never
  unzip.** Unzipping unpacks the internals (`data.pkl`, `data/`, `version`,
  `byteorder`) and destroys the checkpoint.
- Turn off **Safari → Settings → General → "Open 'safe' files after
  downloading"** first, or it unpacks every one automatically.
- After such a rename, Finder may keep hiding the extension, so `ckpt_8000.pt`
  displays as `ckpt_8000`. The name on disk is correct; clear the flag with
  `xattr -d com.apple.FinderInfo <file>`.
- `history.json` arrives as `history.txt`. The contents are already JSON.
- Verify before trusting it — this also reports the true iteration number:

```bash
python -c "
import torch
c = torch.load('runs/ckpt_N.pt', map_location='cpu', weights_only=False)
print('iteration:', c['iter_num'], '· optimizer:', 'optimizer' in c)
"
```

`optimizer: True` matters — without it a resume restarts Adam's momentum from
zero and the loss spikes.

- **`history` resets every run**, so each session's `history.json` covers only
  that session. Download one per session or the loss curve has holes. They go in
  `results/` (tracked) rather than `runs/` (gitignored).

## Two smaller things

- **A cancelled commit still saves its output.** The 12-hour timeout is not
  data loss — a run killed at 43,200.8s still published 720 MB of checkpoints.
- **`--iters` sets the cosine LR decay window.** Aim it at a number you will
  actually reach, so the decay completes. Raising it on a resume is a warm
  restart: the LR jumps back up and the loss bumps for a few hundred iterations
  before improving. That is expected, not a broken resume.

Related: [[training-our-own-chess-opponents]] · [[bf16-on-a-t4-is-emulated]] ·
[[jtrax-free-tier-no-card]]

Tags: #ops #ai #chess #kaggle
