"""Генератор загадочной фоновой музыки. Каждый раз новая мелодия, без авторских прав.
Тёмные пэды минорных аккордов + низкий гул + редкие «колокольчики» + мягкий пульс, всё в реверберации."""
import random
import subprocess
import wave
import numpy as np

SR = 44100
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(0, len(x), 4096):  # блоками, чтобы было быстро
        blk = x[i:i + 4096]
        out = np.empty_like(blk)
        for j, v in enumerate(blk):
            acc = (1 - a) * v + a * acc
            out[j] = acc
        y[i:i + 4096] = out
    return y


def soft_saw(f, t, partials=10, detune=0.0):
    out = np.zeros_like(t)
    for k in range(1, partials + 1):
        out += np.sin(2 * np.pi * f * (1 + detune) * k * t + k) / (k ** 1.3)
    return out


def envelope(n, attack, release):
    env = np.ones(n)
    a, r = min(int(attack * SR), n // 2), min(int(release * SR), n // 2)  # короткий хвост не ломает генерацию
    if a:
        env[:a] = np.linspace(0, 1, a) ** 2
    if r:
        env[-r:] *= np.linspace(1, 0, r) ** 2
    return env


def generate(path, seconds, seed=None):
    rnd = random.Random(seed)
    root = 45 + NOTE[rnd.choice(["A", "D", "E", "C", "G"])] % 12  # тональность (минор)
    # аккорды в миноре: i, VI, III, VII / i, iv, VI, v
    prog = rnd.choice([[0, 8, 3, 10], [0, 5, 8, 7], [0, 8, 5, 7], [0, 3, 8, 10]])
    chord_len = rnd.choice([6.0, 8.0])
    n = int(SR * (seconds + 3))
    t_all = np.arange(n) / SR
    mix = np.zeros(n)

    # пэды
    pos, idx = 0.0, 0
    while pos < seconds + 3:
        deg = prog[idx % len(prog)]
        minor = deg in (0, 5, 7)
        notes = [root + deg, root + deg + (3 if minor else 4), root + deg + 7, root + deg + 12]
        start, length = int(pos * SR), int((chord_len + 2.5) * SR)
        length = min(length, n - start)
        t = np.arange(length) / SR
        chord = sum(soft_saw(hz(m), t, 8, d) for m in notes for d in (-0.003, 0.003)) / 8
        trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.15 * t + idx)
        mix[start:start + length] += chord * envelope(length, 2.0, 2.5) * trem * 0.35
        pos += chord_len
        idx += 1
    mix = lowpass(mix, 900)

    # низкий гул на тонике
    mix += np.sin(2 * np.pi * hz(root - 12) * t_all) * (0.11 + 0.03 * np.sin(2 * np.pi * 0.07 * t_all))

    # «колокольчики» из минорной пентатоники
    scale = [0, 3, 5, 7, 10, 12, 15]
    tt = 1.5
    while tt < seconds:
        f = hz(root + 24 + rnd.choice(scale))
        length = int(3.5 * SR)
        s = int(tt * SR)
        length = min(length, n - s)
        t = np.arange(length) / SR
        bell = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
                + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
        mix[s:s + length] += bell * np.exp(-t * 1.2) * 0.09
        tt += rnd.choice([1.5, 2.0, 2.5, 3.0, 4.0])

    # мягкий пульс, как далёкое сердцебиение
    beat = rnd.choice([1.6, 2.0])
    for k in np.arange(0.0, seconds, beat):
        s = int(k * SR)
        length = min(int(0.35 * SR), n - s)
        t = np.arange(length) / SR
        mix[s:s + length] += np.sin(2 * np.pi * 55 * t * (1 - t)) * np.exp(-t * 14) * 0.25

    mix = mix[: int(SR * seconds)]
    fade = int(2 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.8
    raw = path + ".raw.wav"
    with wave.open(raw, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    # большой «зал», чтобы звучало объёмно и загадочно
    af = ("aecho=0.8:0.7:120|230|370|520|700:0.35|0.27|0.2|0.14|0.09,"
          "highpass=f=45,lowpass=f=7000,loudnorm=I=-24:TP=-3:LRA=9")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", str(SR), "-ac", "2", path], check=True)
    import os
    os.remove(raw)
    return path


if __name__ == "__main__":
    import sys
    generate(sys.argv[1] if len(sys.argv) > 1 else "music_test.wav", 45)


# ---------- Звуковые эффекты (генерируются кодом, без авторских прав) ----------
def _boom(sr):
    t = np.arange(int(sr * 1.4)) / sr
    f = 70 * np.exp(-t * 3) + 32
    phase = 2 * np.pi * np.cumsum(f) / sr
    body = np.sin(phase) * np.exp(-t * 3.2)
    noise = np.random.default_rng(1).standard_normal(len(t)) * np.exp(-t * 25) * 0.35
    return (body + noise) * 0.9


def _whoosh(sr, length=0.55):
    n = int(sr * length)
    t = np.arange(n) / sr
    noise = np.random.default_rng(2).standard_normal(n)
    env = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 2
    # «полёт» частоты: простой резонансный фильтр с плывущей частотой
    out = np.zeros(n)
    y1 = y2 = 0.0
    for i in range(n):
        fc = 300 + 2500 * (t[i] / length)
        w = 2 * np.pi * fc / sr
        r = 0.97
        y = noise[i] * (1 - r) + 2 * r * np.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y
        out[i] = y
    out = out / (np.max(np.abs(out)) + 1e-9)
    return out * env * 0.7


def _tick(sr):
    t = np.arange(int(sr * 0.12)) / sr
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60) * 0.35


def sfx_track(path, seconds, events, sr=44100):
    """events: список (время в секундах, вид: boom / whoosh / tick, громкость)."""
    track = np.zeros(int(sr * (seconds + 2)))
    cache = {"boom": _boom(sr), "whoosh": _whoosh(sr), "tick": _tick(sr)}
    for t0, kind, vol in events:
        s = cache[kind] * vol
        i = int(t0 * sr)
        if i >= len(track):
            continue
        e = min(len(track), i + len(s))
        track[i:e] += s[: e - i]
    track = np.clip(track, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((track * 32767).astype(np.int16).tobytes())
    return path
