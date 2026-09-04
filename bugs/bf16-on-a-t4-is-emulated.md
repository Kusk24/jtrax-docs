# bf16 on a T4 is emulated, and PyTorch says it is supported

**Found:** 2026-09-02 · **Repo:** `jtrax-ai` · **Symptom:** Kaggle training ran
~6× slower than it should have, with nothing in the logs marked as wrong.

`torch.cuda.is_bf16_supported()` returns `True` on a Tesla T4. It should not be
used to choose a training precision.

## Symptom

A Kaggle commit with `GPU T4 ×2` attached reached only **4,000 iterations in
12 hours** before the session cap killed it — about 10.8 s/iter for a 25.7M
model at 98,208 tokens per iteration. A back-of-envelope figure for a T4 is
closer to 1–2 s/iter.

The only clue was one line of our own log output:

```
precision: bfloat16
```

Everything else looked healthy: `device: cuda`, the accelerator badge said
`GPU T4 ×2`, loss was falling, checkpoints were saving.

## Cause

A T4 is Turing, compute capability **7.5**. Real bf16 tensor cores arrive with
Ampere (8.0). But recent PyTorch implements:

```python
def is_bf16_supported(including_emulation: bool = True):
```

and the default is `True`. On a T4 the fast path (CUDA ≥ 11 **and** capability
major ≥ 8) fails, so it falls through to simply *creating a bf16 tensor* — which
succeeds, because bf16 **storage** works fine on Turing. Only the tensor-core
maths is missing. So the function answers "yes" to a question we were not asking.

`jtrax-ai/step5_train.py` asked exactly that question:

```python
if torch.cuda.is_bf16_supported():
    return torch.bfloat16, False   # no scaler needed
```

so the T4 got bf16 with no gradient scaler, and every matmul took the slow path.
The comment above it already said *"bf16 needs Ampere or newer (Kaggle's T4 is
Turing)"* — the intent was right, the check was wrong.

## Fix

Ask the compute capability directly. `step5_train.py:41`:

```python
major, _ = torch.cuda.get_device_capability()
if major >= 8:   # Ampere and newer: real bf16 tensor cores, no scaler needed
    return torch.bfloat16, False
if major == 7:   # Turing (T4): fp16 is the fast path
    return torch.float16, True
return torch.float32, False   # Pascal (P100): fp16 is not a win
```

Verified against all four device classes by stubbing `get_device_capability`:

```
P100 (Pascal, sm_60) -> torch.float32
T4   (Turing, sm_75) -> torch.float16  + grad scaler
L4   (Ada,    sm_89) -> torch.bfloat16
cpu                  -> torch.float32
```

## Effect

Same model, same corpus, same accelerator:

| precision | throughput |
|---|---|
| `bfloat16` (emulated) | 4,000 iterations / 12 h |
| `float16` + grad scaler | 8,000 iterations / ~4 h |

Roughly **6×**. It turned a run that could not finish inside the 12-hour session
cap into one that finished with hours to spare.

## Why it went unnoticed for a whole session

Nothing failed. The wrong precision is not an error — it is a slower correct
answer. The only signal was a throughput number that had nothing to compare
against until a second run existed.

The generalisable version: **log the resolved configuration, not just the
requested one.** `precision: bfloat16` was printed and ignored for two
sessions because no one knew what it should have said. A line that reads
`precision: bfloat16 (emulated — no tensor cores on sm_75)` would have been
caught immediately.

Related: [[training-our-own-chess-opponents]] ·
[[resuming-a-kaggle-training-run]]

Tags: #bug #ai #chess #performance
