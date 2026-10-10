"""Original upbeat background track for the pitch video (no samples, no licences).

120 BPM, C major (C G Am F). Soft intro while WorkBuddy types, drums and bass
from the four-window scene, full groove through the app tour, a final chord
hit on the end card. Writes public/music.wav.
"""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
LEN = 90.0
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4
N = int(SR * LEN)
rng = np.random.default_rng(7)

t_all = np.arange(N) / SR
out = np.zeros((N, 2))


def note(f, dur, kind="saw", amp=0.2, attack=0.01, release=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    if kind == "saw":
        w = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 8))
    elif kind == "tri":
        w = sum(((-1) ** ((k - 1) // 2)) * np.sin(2 * np.pi * f * k * t) / k**2 for k in range(1, 9, 2))
    elif kind == "pluck":
        w = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
    else:
        w = np.sin(2 * np.pi * f * t)
    env = np.ones(n)
    a = max(1, int(SR * attack))
    r = max(1, int(SR * release))
    env[:a] = np.linspace(0, 1, a)
    if kind == "pluck":
        env *= np.exp(-t * 6)
    env[-r:] *= np.linspace(1, 0, r)
    return w * env * amp


def put(sig, at, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i : i + len(sig), 0] += sig * l
    out[i : i + len(sig), 1] += sig * r


def lowpass(x, cut):
    b, a = butter(2, cut / (SR / 2))
    return lfilter(b, a, x)


hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# C, G, Am, F as MIDI triads (root octave 3/4)
CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
ROOTS = [36, 43, 45, 41]

INTRO = 9.0  # WorkBuddy typing
DRUMS = 9.0
SNARE = 15.0
END = 85.5  # end card
bars = int(END / BAR) + 1

for b in range(bars):
    t0 = b * BAR
    if t0 >= END:
        break
    ch = CHORDS[b % 4]
    # Pads: whole bar, soft saw through a lowpass, a touch brighter after the intro.
    pad = sum(note(hz(m), BAR + 0.3, "saw", 0.05, attack=0.3, release=0.5) for m in ch)
    pad = lowpass(pad, 1400 if t0 < INTRO else 2600)
    put(pad, t0, -0.2)
    put(lowpass(sum(note(hz(m + 12), BAR + 0.3, "tri", 0.03, attack=0.3, release=0.5) for m in ch), 3000), t0, 0.25)
    # Arpeggio: 8th notes, the "typing" sparkle.
    pattern = [0, 1, 2, 1, 2, 0, 1, 2]
    for k in range(8):
        m = ch[pattern[k]] + 12 + (12 if (b % 2 and k >= 4) else 0)
        put(note(hz(m), BEAT / 2, "pluck", 0.09 if t0 >= INTRO else 0.06, attack=0.003, release=0.08), t0 + k * BEAT / 2, 0.35 if k % 2 else -0.35)
    if t0 >= DRUMS:
        # Bass: root on 1 and the "and" of 2, octave on 3.
        root = ROOTS[b % 4]
        for at, m, d in [(0, root, BEAT * 1.4), (BEAT * 1.5, root, BEAT * 0.4), (BEAT * 2, root + 12, BEAT * 0.9), (BEAT * 3, root + 7, BEAT * 0.9)]:
            put(lowpass(note(hz(m), d, "saw", 0.16, attack=0.005, release=0.06), 700), t0 + at)
        for k in range(4):
            # Kick
            kt = np.arange(int(SR * 0.35)) / SR
            f = 50 + 90 * np.exp(-kt * 30)
            kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 9) * 0.55
            put(kick, t0 + k * BEAT)
            # Hats on the off-beats
            hat = lowpass(rng.standard_normal(int(SR * 0.05)), 9000) * np.exp(-np.arange(int(SR * 0.05)) / SR * 70) * 0.08
            hat = hat - lowpass(hat, 6000)
            put(hat, t0 + k * BEAT + BEAT / 2, 0.3)
            if t0 >= SNARE and k in (1, 3):
                sn = lowpass(rng.standard_normal(int(SR * 0.18)), 5000) * np.exp(-np.arange(int(SR * 0.18)) / SR * 22) * 0.22
                body = note(190, 0.12, "sine", 0.12, attack=0.001, release=0.1)
                sn[: len(body)] += body
                put(sn, t0 + k * BEAT, -0.1)

# Small riser into the end card, then the final C major hit that rings out.
rise_t = np.arange(int(SR * 2.0)) / SR
riser = lowpass(rng.standard_normal(len(rise_t)), 6000) * (rise_t / 2.0) ** 2 * 0.12
put(riser, END - 2.0)
hit = sum(note(hz(m), LEN - END, "saw", 0.07, attack=0.005, release=2.5) for m in [48, 60, 64, 67, 72])
put(lowpass(hit, 3500), END)
kt = np.arange(int(SR * 0.6)) / SR
put(np.sin(2 * np.pi * np.cumsum(45 + 80 * np.exp(-kt * 25)) / SR) * np.exp(-kt * 5) * 0.6, END)
for k, m in enumerate([72, 76, 79, 84]):
    put(note(hz(m), 1.2, "pluck", 0.08, attack=0.003, release=0.6), END + 0.12 * k, 0.3 if k % 2 else -0.3)

# Light room reverb.
ir_t = np.arange(int(SR * 1.2)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5)
ir /= np.abs(ir).sum()
for c in range(2):
    wet = fftconvolve(out[:, c], ir * 18)[:N]
    out[:, c] = out[:, c] * 0.85 + wet * 0.22

# Fades and level.
fade_in = np.clip(t_all / 1.5, 0, 1)
fade_out = np.clip((LEN - t_all) / 2.5, 0, 1)
out *= (fade_in * fade_out)[:, None]
out /= np.abs(out).max() / 0.85
wavfile.write("public/music.wav", SR, (out * 32767).astype(np.int16))
print("wrote public/music.wav", LEN, "s")
