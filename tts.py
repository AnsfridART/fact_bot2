"""Озвучка: мужской голос Piper (работает прямо на сервере), запасной вариант edge-tts.
На выходе всегда wav 22050 Гц моно, чтобы считать по нему движение рта."""
import asyncio
import os
import subprocess
import wave
import config

_voice = None


def _piper(text, wav_path):
    global _voice
    from piper import PiperVoice
    if _voice is None:
        _voice = PiperVoice.load(config.PIPER_MODEL)
    with wave.open(wav_path, "wb") as wf:
        if hasattr(_voice, "synthesize_wav"):  # piper-tts 1.3+
            try:
                from piper import SynthesisConfig
                _voice.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=config.PIPER_SPEED))
            except ImportError:
                _voice.synthesize_wav(text, wf)
        else:  # piper-tts 1.2
            _voice.synthesize(text, wf, length_scale=config.PIPER_SPEED)


def _edge(text, mp3_path):
    import edge_tts
    asyncio.run(edge_tts.Communicate(text, config.FALLBACK_VOICE, rate="+8%").save(mp3_path))


def _to_wav(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ar", "22050", "-ac", "1", dst], check=True)


def synthesize(text: str, wav_path: str) -> str:
    tmp = wav_path + ".tmp"
    try:
        _piper(text, tmp + ".wav")
        _to_wav(tmp + ".wav", wav_path)
    except Exception as e:
        print("Piper не сработал, пробую edge-tts:", e)
        _edge(text, tmp + ".mp3")
        _to_wav(tmp + ".mp3", wav_path)
    for ext in (".wav", ".mp3"):
        if os.path.exists(tmp + ext):
            os.remove(tmp + ext)
    return wav_path
