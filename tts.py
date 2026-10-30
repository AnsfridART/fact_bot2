"""Озвучка мужским голосом Piper: медленнее, с паузами между предложениями и пониженным тоном.
Запасной вариант: edge-tts. На выходе wav 22050 Гц моно."""
import asyncio
import os
import re
import subprocess
import wave
import config

_voices = {}
SR = 22050


def _load(name):
    from piper import PiperVoice
    if name not in _voices:
        _voices[name] = PiperVoice.load(f"models/{name}.onnx")
    return _voices[name]


def _piper_sentence(voice, text, path, speed):
    with wave.open(path, "wb") as wf:
        if hasattr(voice, "synthesize_wav"):  # piper-tts 1.3+
            from piper import SynthesisConfig
            voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=speed))
        else:  # piper-tts 1.2
            voice.synthesize(text, wf, length_scale=speed)


def _ffmpeg(src, dst, pitch=1.0):
    af = f"asetrate={int(SR * pitch)},aresample={SR},atempo={1 / pitch:.4f}" if pitch != 1.0 else "anull"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af,
                    "-ar", str(SR), "-ac", "1", "-sample_fmt", "s16", dst], check=True)


def _read(path):
    with wave.open(path) as w:
        return w.readframes(w.getnframes())


def piper(text, wav_path, voice=None, speed=None, pitch=None):
    voice = voice or config.VOICE
    speed = speed or config.VOICE_SPEED
    pitch = pitch or config.VOICE_PITCH
    v = _load(voice)
    parts = [p for p in re.split(r"(?<=[.!?…])\s+", text.strip()) if p]
    silence = b"\x00\x00" * int(SR * config.SENTENCE_PAUSE)
    chunks = []
    for i, part in enumerate(parts):
        raw, norm = f"{wav_path}.{i}.raw.wav", f"{wav_path}.{i}.wav"
        _piper_sentence(v, part, raw, speed)
        _ffmpeg(raw, norm, pitch)
        chunks.append(_read(norm))
        os.remove(raw)
        os.remove(norm)
    with wave.open(wav_path, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes(silence.join(chunks) + silence[: len(silence) // 2])
    return wav_path


def _edge(text, wav_path):
    import edge_tts
    mp3 = wav_path + ".mp3"
    asyncio.run(edge_tts.Communicate(text, config.FALLBACK_VOICE, rate="-5%", pitch="-8Hz").save(mp3))
    _ffmpeg(mp3, wav_path)
    os.remove(mp3)


def synthesize(text: str, wav_path: str) -> str:
    try:
        return piper(text, wav_path)
    except Exception as e:
        print("Piper не сработал, пробую edge-tts:", e)
        _edge(text, wav_path)
        return wav_path
