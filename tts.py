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
STUDIO = ",".join([
    "highpass=f=70",
    "equalizer=f=140:t=q:w=1.0:g=3",      # тепло и «грудной» голос
    "equalizer=f=380:t=q:w=1.2:g=-2.5",   # убираем «бубнение»
    "equalizer=f=3200:t=q:w=1.0:g=2",     # разборчивость
    "equalizer=f=9000:t=q:w=1.0:g=1.5",   # воздух
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=3",
    "aecho=0.85:0.55:28|47|71:0.14|0.09|0.05",  # небольшая студийная комната
    "loudnorm=I=-15:TP=-1.5:LRA=7",
])


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


def _silero_sentence(text, path, voice, speed, pitch):
    global _silero
    import torch
    if _silero is None:
        _silero = torch.package.PackageImporter("models/silero_ru.pt").load_pickle("tts_models", "model")
        _silero.to(torch.device("cpu"))
    rate = {True: "slow", False: "medium"}[speed >= 1.15]
    ssml = f'<speak><prosody rate="{rate}" pitch="{"low" if pitch < 0.95 else "medium"}">{text}</prosody></speak>'
    audio = _silero.apply_tts(ssml_text=ssml, speaker=voice, sample_rate=48000, put_accent=True, put_yo=True)
    _write_wav(path, (audio.numpy() * 32767).astype(np.int16), 48000)


# ---------- Yandex SpeechKit ----------
def _yandex_sentence(text, path, voice, speed, pitch):
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


def _piper_sentence(text, path, voice, speed, pitch):
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


def render(text, wav_path, engine, voice, speed=None, pitch=None, studio=True):
    """Озвучивает текст по предложениям, вставляет паузы, накладывает обработку."""
    speed = speed or config.VOICE_SPEED
    pitch = pitch or config.VOICE_PITCH
    fn = ENGINES[engine]
    if engine == "silero":
        text = numbers_to_words(text)
    silence = b"\x00\x00" * int(SR * config.SENTENCE_PAUSE)
    chunks = []
    for i, part in enumerate(split_sentences(text)):
        raw, norm = f"{wav_path}.{i}.raw.wav", f"{wav_path}.{i}.wav"
        fn(part, raw, voice, speed, pitch)
        af = "anull"
        if engine == "piper" and pitch != 1.0:  # у Piper тон понижаем вручную
            af = f"aresample=22050,asetrate={int(22050 * pitch)},aresample={SR},atempo={1 / pitch:.4f}"
        _ffmpeg(raw, norm, af)
        chunks.append(_read(norm))
        os.remove(raw)
        os.remove(norm)
    dry = wav_path + ".dry.wav"
    with wave.open(dry, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(silence.join(chunks) + silence[: len(silence) // 2])
    _ffmpeg(dry, wav_path, STUDIO if studio else "anull")
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
