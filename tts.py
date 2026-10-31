"""Озвучка. Движки: silero (бесплатный), yandex (SpeechKit, лучшее качество), piper (запасной), edge-tts.
Поверх любого движка — «студийная» обработка: тёплые низы, компрессия, лёгкая комната, ровная громкость."""
import asyncio
import os
import re
import subprocess
import wave
import numpy as np
import requests
import config

SR = 44100
PRESETS = {}
PRESETS["studio"] = ",".join([
    "highpass=f=70",
    "equalizer=f=140:t=q:w=1.0:g=3",      # тепло и «грудной» голос
    "equalizer=f=380:t=q:w=1.2:g=-2.5",   # убираем «бубнение»
    "equalizer=f=3200:t=q:w=1.0:g=2",     # разборчивость
    "equalizer=f=9000:t=q:w=1.0:g=1.5",   # воздух
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=3",
    "aecho=0.85:0.55:28|47|71:0.14|0.09|0.05",  # небольшая студийная комната
    "loudnorm=I=-15:TP=-1.5:LRA=7",
])
# «дикторский»: больше низов и плотности, чуть больше зала
PRESETS["deep"] = ",".join([
    "highpass=f=55",
    "equalizer=f=110:t=q:w=0.9:g=5",
    "equalizer=f=320:t=q:w=1.2:g=-3",
    "equalizer=f=2600:t=q:w=1.0:g=2.5",
    "equalizer=f=8500:t=q:w=1.0:g=1.5",
    "acompressor=threshold=-22dB:ratio=4:attack=4:release=120:makeup=4",
    "aecho=0.85:0.6:35|60|95|140:0.16|0.11|0.07|0.04",
    "loudnorm=I=-14:TP=-1.5:LRA=6",
])
# «мудрый дед»: тёплый, мягкий, лёгкая дрожь в голосе, уютная комната
PRESETS["grandpa"] = ",".join([
    "highpass=f=65",
    "equalizer=f=160:t=q:w=1.0:g=2.5",
    "equalizer=f=350:t=q:w=1.2:g=-2",
    "equalizer=f=2400:t=q:w=1.0:g=2",
    "equalizer=f=6500:t=q:w=1.5:g=-2",      # мягче «металл» синтезатора
    "acompressor=threshold=-18dB:ratio=2.2:attack=10:release=180:makeup=2",
    "aecho=0.85:0.6:32|55|88|130:0.13|0.09|0.05|0.03",
    "loudnorm=I=-15:TP=-1.5:LRA=11",
])
# «энергичный рассказчик»: плотный, чёткий, с напором, но без пережатия и металла
PRESETS["energetic"] = ",".join([
    "highpass=f=70",
    "equalizer=f=130:t=q:w=1.0:g=3",       # плотные низы, голос ниже по ощущению
    "equalizer=f=320:t=q:w=1.3:g=-2.5",    # без бубнения
    "equalizer=f=2800:t=q:w=1.0:g=3",      # чёткость и напор
    "equalizer=f=6800:t=q:w=1.4:g=-2.5",   # гасим «синтетический» металл
    "lowpass=f=11500",
    "acompressor=threshold=-19dB:ratio=3:attack=8:release=120:makeup=3",
    "aecho=0.85:0.55:25|45|70:0.10|0.06|0.03",  # совсем небольшая комната
    "loudnorm=I=-14:TP=-1.5:LRA=9",
])
STUDIO = PRESETS["studio"]


def _ffmpeg(src, dst, af):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af,
                    "-ar", str(SR), "-ac", "1", "-sample_fmt", "s16", dst], check=True)


def _write_wav(path, samples_int16, sr):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(samples_int16.tobytes())


def _read(path):
    with wave.open(path) as w:
        return w.readframes(w.getnframes())


def numbers_to_words(text):
    try:
        from num2words import num2words
        return re.sub(r"\d+", lambda m: num2words(int(m.group()), lang="ru"), text.replace("\u00a0", ""))
    except Exception:
        return text


def split_sentences(text):
    return [p for p in re.split(r"(?<=[.!?…])\s+", text.strip()) if p]


# ---------- Silero ----------
_silero = None


def _silero_sentence(text, path, voice, speed, pitch, mood="plain"):
    """Интонация меняется по предложению: вопрос выше, восклицание ярче, «…» медленнее и с паузой."""
    global _silero
    import torch
    if _silero is None:
        _silero = torch.package.PackageImporter("models/silero_ru.pt").load_pickle("tts_models", "model")
        _silero.to(torch.device("cpu"))
    tones = ["x-low", "low", "medium", "high", "x-high"]
    base = 0 if pitch < 0.85 else 1 if pitch < 0.95 else 2 if pitch < 1.05 else 3
    rate = "slow" if speed >= 1.15 else "medium"
    if mood == "question":
        base, rate = base + 1, "medium"
    elif mood == "exclaim":
        base, rate = base + 1, "fast" if rate == "medium" else "medium"
    elif mood == "suspense":
        base, rate = max(0, base - 1), "slow"
    elif mood == "low":
        base = max(0, base - 1)
    tone = tones[min(base, len(tones) - 1)]
    tail = '<break time="450ms"/>' if mood == "suspense" else ""
    ssml = f'<speak><prosody rate="{rate}" pitch="{tone}">{text}</prosody>{tail}</speak>'
    audio = _silero.apply_tts(ssml_text=ssml, speaker=voice, sample_rate=48000, put_accent=True, put_yo=True)
    _write_wav(path, (audio.numpy() * 32767).astype(np.int16), 48000)


def sentence_mood(sentence, i, total):
    s = sentence.strip()
    if s.endswith("?"):
        return "question"
    if s.endswith("!"):
        return "exclaim"
    if s.endswith("…") or s.endswith("..."):
        return "suspense"
    if total > 1 and i == total - 1 and len(s) < 40:
        return "low"  # короткий финальный вывод — чуть ниже, весомее
    return "plain"


# ---------- Yandex SpeechKit ----------
def _yandex_sentence(text, path, voice, speed, pitch, mood="plain"):
    data = {"text": text, "lang": "ru-RU", "voice": voice, "speed": f"{1 / speed:.2f}",
            "format": "lpcm", "sampleRateHertz": "48000"}
    if config.YC_FOLDER_ID:
        data["folderId"] = config.YC_FOLDER_ID
    r = requests.post("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize",
                      headers={"Authorization": f"Api-Key {config.SPEECHKIT_API_KEY}"}, data=data, timeout=60)
    if not r.ok:
        raise RuntimeError(f"SpeechKit {r.status_code}: {r.text[:300]}")
    _write_wav(path, np.frombuffer(r.content, dtype=np.int16), 48000)


# ---------- Piper ----------
_piper_voices = {}


def _piper_sentence(text, path, voice, speed, pitch, mood="plain"):
    from piper import PiperVoice
    if voice not in _piper_voices:
        _piper_voices[voice] = PiperVoice.load(f"models/{voice}.onnx")
    v = _piper_voices[voice]
    with wave.open(path, "wb") as wf:
        if hasattr(v, "synthesize_wav"):
            from piper import SynthesisConfig
            v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=speed))
        else:
            v.synthesize(text, wf, length_scale=speed)


ENGINES = {"silero": _silero_sentence, "yandex": _yandex_sentence, "piper": _piper_sentence}


def render(text, wav_path, engine, voice, speed=None, pitch=None, post_pitch=None, preset=None):
    """Озвучивает текст по предложениям, вставляет паузы, понижает тон и накладывает обработку."""
    speed = speed or config.VOICE_SPEED
    pitch = pitch or config.VOICE_PITCH
    post_pitch = post_pitch or config.VOICE_POST_PITCH
    preset = preset or config.VOICE_PRESET
    fn = ENGINES[engine]
    if engine == "silero":
        text = numbers_to_words(text)
    silence = b"\x00\x00" * int(SR * config.SENTENCE_PAUSE)
    chunks = []
    parts = split_sentences(text)
    for i, part in enumerate(parts):
        raw, norm = f"{wav_path}.{i}.raw.wav", f"{wav_path}.{i}.wav"
        mood = sentence_mood(part, i, len(parts))
        fn(part, raw, voice, speed, pitch, mood=mood)
        shift = post_pitch * (pitch if engine == "piper" else 1.0)  # у Piper тон меняем только вручную
        filters = ["aresample=48000"]
        if abs(shift - 1.0) > 0.001:
            filters += [f"asetrate={int(48000 * shift)}", "aresample=48000", f"atempo={1 / shift:.4f}"]
        if abs(config.VOICE_TEMPO - 1.0) > 0.001:
            filters.append(f"atempo={config.VOICE_TEMPO}")
        _ffmpeg(raw, norm, ",".join(filters))
        chunks.append(_read(norm))
        if mood == "suspense":
            chunks[-1] += b"\x00\x00" * int(SR * 0.25)
        os.remove(raw)
        os.remove(norm)
    dry = wav_path + ".dry.wav"
    with wave.open(dry, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(silence.join(chunks) + silence[: len(silence) // 2])
    trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
    _ffmpeg(dry, wav_path, trim + PRESETS.get(preset, STUDIO))
    os.remove(dry)
    return wav_path


def _edge(text, wav_path):
    import edge_tts
    mp3 = wav_path + ".mp3"
    asyncio.run(edge_tts.Communicate(text, config.FALLBACK_VOICE, rate="-5%", pitch="-8Hz").save(mp3))
    _ffmpeg(mp3, wav_path, STUDIO)
    os.remove(mp3)


def synthesize(text: str, wav_path: str) -> str:
    order = [(config.TTS_ENGINE, config.VOICE)]
    order += [("silero", "aidar"), ("piper", "dmitri")]
    for engine, voice in order:
        try:
            if engine == "yandex" and not config.SPEECHKIT_API_KEY:
                continue
            return render(text, wav_path, engine, voice)
        except Exception as e:
            print(f"{engine}/{voice} не сработал: {e}")
    _edge(text, wav_path)
    return wav_path
