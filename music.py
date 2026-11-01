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


def generate(path, seconds, seed=None, mood="mystery"):
    """Настроения: mystery (загадочно), funny (весело), tense (тревожно), epic (эпично)."""
    rnd = random.Random(seed)
    root = 45 + NOTE[rnd.choice(["A", "D", "E", "C", "G"])] % 12
    if mood == "funny":
        prog = [(0, False), (7, False), (9, True), (5, False)]
        chord_len, cutoff, pad_vol, drone_vol = 4.0, 1800, 0.22, 0.03
    elif mood == "tense":
        prog = [(0, True), (1, False), (0, True), (6, False)]
        chord_len, cutoff, pad_vol, drone_vol = 6.0, 650, 0.3, 0.16
    elif mood == "epic":
        prog = [(0, True), (8, False), (3, False), (10, False)]
        chord_len, cutoff, pad_vol, drone_vol = 4.0, 1300, 0.34, 0.1
    else:
        prog = [(d, d in (0, 5, 7)) for d in rnd.choice([[0, 8, 3, 10], [0, 5, 8, 7], [0, 8, 5, 7], [0, 3, 8, 10]])]
        chord_len, cutoff, pad_vol, drone_vol = rnd.choice([6.0, 8.0]), 900, 0.35, 0.11
    n = int(SR * (seconds + 3))
    t_all = np.arange(n) / SR
    mix = np.zeros(n)

    # пэды
    pos, idx = 0.0, 0
    while pos < seconds + 3:
        deg, minor = prog[idx % len(prog)]
        notes = [root + deg, root + deg + (3 if minor else 4), root + deg + 7, root + deg + 12]
        start, length = int(pos * SR), int((chord_len + 2.5) * SR)
        length = min(length, n - start)
        if length <= 0:
            break
        t = np.arange(length) / SR
        chord = sum(soft_saw(hz(m), t, 8, d) for m in notes for d in (-0.003, 0.003)) / 8
        trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.15 * t + idx)
        mix[start:start + length] += chord * envelope(length, 1.2 if mood == "funny" else 2.0, 2.5) * trem * pad_vol
        # весёлое пиццикато: арпеджио по аккорду
        if mood == "funny":
            for j, k in enumerate(np.arange(0, chord_len, 0.25)):
                s0 = start + int(k * SR)
                L = min(int(0.22 * SR), n - s0)
                if L <= 0:
                    break
                tt = np.arange(L) / SR
                f = hz(notes[[0, 2, 1, 3, 2, 1][j % 6]] + 12)
                mix[s0:s0 + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18) * 0.16
        pos += chord_len
        idx += 1
    mix = lowpass(mix, cutoff)

    # низкий гул на тонике
    mix += np.sin(2 * np.pi * hz(root - 12) * t_all) * (drone_vol + 0.03 * np.sin(2 * np.pi * 0.07 * t_all))

    # ритм: весёлый бас, тревожное остинато, эпичные барабаны
    if mood in ("funny", "tense", "epic"):
        step = {"funny": 0.5, "tense": 0.3, "epic": 0.75}[mood]
        for j, k in enumerate(np.arange(0.0, seconds, step)):
            s0 = int(k * SR)
            L = min(int(0.35 * SR), n - s0)
            if L <= 0:
                break
            tt = np.arange(L) / SR
            if mood == "funny":
                f = hz(root - 12 + (7 if j % 2 else 0))
                mix[s0:s0 + L] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 10) * 0.3
            elif mood == "tense":
                f = hz(root - 12 + (1 if j % 8 == 7 else 0))
                mix[s0:s0 + L] += soft_saw(f, tt, 5) * np.exp(-tt * 14) * 0.18
            else:
                if j % 2 == 0:
                    ff = 60 * np.exp(-tt * 6) + 40
                    mix[s0:s0 + L] += np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tt * 7) * 0.6
                else:
                    mix[s0:s0 + L] += np.random.default_rng(j).standard_normal(L) * np.exp(-tt * 25) * 0.12

    # «колокольчики» — только для загадочного настроения
    if mood == "mystery":
        scale = [0, 3, 5, 7, 10, 12, 15]
        tt0 = 1.5
        while tt0 < seconds:
            f = hz(root + 24 + rnd.choice(scale))
            s = int(tt0 * SR)
            length = min(int(3.5 * SR), n - s)
            t = np.arange(length) / SR
            bell = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
                    + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
            mix[s:s + length] += bell * np.exp(-t * 1.2) * 0.09
            tt0 += rnd.choice([1.5, 2.0, 2.5, 3.0, 4.0])
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
    cache.update({k: fn(sr) for k, fn in ACTION_SFX.items()})
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


# ---------- Атмосфера мест (фоновые звуки) ----------
def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def _onepole(x, cutoff, sr=SR):
    """Быстрый однополюсный фильтр через свёртку с экспонентой (без питоновских циклов)."""
    a = np.exp(-2 * np.pi * cutoff / sr)
    k = int(sr * 5 / max(cutoff, 1)) + 1
    kernel = (1 - a) * a ** np.arange(min(k, 20000))
    return np.convolve(x, kernel, mode="same")


def _amb_wind(n, sr, seed):
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / sr * 0.13 + seed)
    return _onepole(_noise(n, seed), 400, sr) * lfo * 3.0


def _amb_city(n, sr, seed):
    base = _onepole(_noise(n, seed), 180, sr) * 2.5
    t = np.arange(n) / sr
    clop = np.zeros(n)
    for k in np.arange(0.4, n / sr, 0.33):  # стук копыт по мостовой
        i = int(k * sr)
        L = min(int(0.03 * sr), n - i)
        clop[i:i + L] += np.sin(2 * np.pi * 900 * t[:L]) * np.exp(-t[:L] * 120) * 0.15
    return base + clop


def _amb_sea(n, sr, seed):
    t = np.arange(n) / sr
    swell = (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.5 + seed)) ** 2
    return _onepole(_noise(n, seed), 900, sr) * swell * 2.2


def _amb_rain(n, sr, seed):
    return (_noise(n, seed) - _onepole(_noise(n, seed), 2500, sr)) * 0.08


def _amb_fire(n, sr, seed):
    rng = np.random.default_rng(seed)
    out = _onepole(_noise(n, seed), 300, sr) * 1.5
    for _ in range(int(n / sr * 14)):  # треск поленьев
        i = rng.integers(0, max(1, n - 400))
        out[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40) * 0.6
    return out


def _amb_birds(n, sr, seed):
    rng = np.random.default_rng(seed)
    out = _amb_wind(n, sr, seed) * 0.5
    t = np.arange(int(0.12 * sr)) / sr
    for _ in range(int(n / sr * 1.2)):  # щебет
        i = rng.integers(0, max(1, n - len(t)))
        f0 = rng.uniform(2500, 4200)
        out[i:i + len(t)] += np.sin(2 * np.pi * (f0 + 1800 * t / t[-1]) * t) * np.sin(np.pi * t / t[-1]) * 0.12
    return out


def _amb_room(n, sr, seed):
    t = np.arange(n) / sr
    out = _onepole(_noise(n, seed), 120, sr) * 0.8
    for k in np.arange(0.5, n / sr, 1.0):  # часы на стене
        i = int(k * sr)
        L = min(int(0.02 * sr), n - i)
        out[i:i + L] += np.sin(2 * np.pi * 2200 * t[:L]) * np.exp(-t[:L] * 300) * 0.08
    return out


def _amb_war(n, sr, seed):
    rng = np.random.default_rng(seed)
    out = _amb_wind(n, sr, seed) * 0.6
    b = _boom(sr) * 0.35
    for _ in range(int(n / sr / 3)):  # далёкие разрывы
        i = rng.integers(0, max(1, n - len(b)))
        out[i:i + len(b)] += _onepole(b, 200, sr)
    return out


AMBIENCE = {
    "field_dusk": _amb_wind, "outback": _amb_wind, "sky": _amb_wind, "night_field": _amb_wind,
    "london": _amb_city, "old_street": _amb_city, "paris": _amb_city, "harbor": _amb_sea, "beach_night": _amb_sea,
    "town": _amb_fire, "forest": _amb_birds, "jungle": _amb_birds, "campus": _amb_birds,
    "office": _amb_room, "room": _amb_room, "museum": _amb_room, "classroom": _amb_room, "war": _amb_war,
    "winter_city": _amb_wind,
}


def ambience_track(path, segments, fps, total_sec, sr=SR):
    """Склеивает атмосферу мест по сценам с мягкими переходами."""
    track = np.zeros(int(sr * (total_sec + 1)))
    fade = int(0.3 * sr)
    for k, sg in enumerate(segments):
        fn = AMBIENCE.get(sg.get("bg"))
        if not fn:
            continue
        i0, n = int(sg["start"] / fps * sr), int(sg["dur"] / fps * sr) + fade
        n = min(n, len(track) - i0)
        if n <= fade * 2:
            continue
        x = fn(n, sr, k + 3)
        x = x / (np.max(np.abs(x)) + 1e-9) * 0.5
        x[:fade] *= np.linspace(0, 1, fade)
        x[-fade:] *= np.linspace(1, 0, fade)
        track[i0:i0 + n] += x
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())
    return path


# ---------- Звуки действий ----------
def _thunder(sr):
    n = int(sr * 2.5)
    t = np.arange(n) / sr
    crack = _noise(n, 7) * np.exp(-t * 18) * 0.8
    rumble = _onepole(_noise(n, 8), 120, sr) * np.exp(-t * 1.4) * 6
    return crack + rumble


def _wings(sr):
    n = int(sr * 0.8)
    out = np.zeros(n)
    for k in range(5):
        i = int(k * 0.15 * sr)
        L = int(0.07 * sr)
        out[i:i + L] += _onepole(_noise(L, k), 1200, sr) * np.sin(np.pi * np.arange(L) / L) * 3
    return out


def _stamp(sr):
    t = np.arange(int(sr * 0.3)) / sr
    return (np.sin(2 * np.pi * 90 * t) * 0.8 + _noise(len(t), 3) * 0.3) * np.exp(-t * 22)


def _paper(sr):
    n = int(sr * 0.5)
    x = _noise(n, 4) - _onepole(_noise(n, 4), 1500, sr)
    return x * (0.4 + 0.6 * np.abs(np.sin(np.arange(n) / sr * 40))) * np.exp(-np.arange(n) / sr * 4) * 0.5


def _snap(sr):
    t = np.arange(int(sr * 0.25)) / sr
    return _noise(len(t), 5) * np.exp(-t * 50) * 0.9


def _clocktick(sr):
    t = np.arange(int(sr * 2.0)) / sr
    out = np.zeros(len(t))
    for k in range(4):
        i = int(k * 0.5 * sr)
        L = int(0.025 * sr)
        out[i:i + L] += np.sin(2 * np.pi * 2400 * t[:L]) * np.exp(-t[:L] * 250) * 0.6
    return out


ACTION_SFX = {"thunder": _thunder, "wings": _wings, "stamp": _stamp, "paper": _paper, "snap": _snap,
              "clock": _clocktick, "fire": lambda sr: _amb_fire(int(sr * 1.5), sr, 9) * 0.3}
