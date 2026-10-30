"""Тест голосов: присылает в Telegram одну фразу разными движками и голосами (с обработкой)."""
import os
import subprocess
import requests
import config
import tts

PHRASE = ("Гренландская акула может прожить около четырёхсот лет. "
          "Некоторые из них плавали в океане ещё до рождения Петра Первого!")

# (движок, голос, скорость: больше = медленнее, тон: меньше = ниже)
VARIANTS = [
    ("silero", "aidar", 1.2, 0.9), ("silero", "aidar", 1.0, 0.9),
    ("silero", "eugene", 1.2, 0.9), ("silero", "eugene", 1.0, 0.9),
    ("piper", "dmitri", 1.22, 0.9),
]


def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=120, **kw)
    r.raise_for_status()


def main():
    os.makedirs("work", exist_ok=True)
    for n, (engine, voice, speed, pitch) in enumerate(VARIANTS, 1):
        tempo = "медленно" if speed >= 1.15 else "обычно"
        label = f"Вариант {n}: {engine} / {voice}, {tempo}"
        try:
            wav, mp3 = f"work/v{n}.wav", f"work/v{n}.mp3"
            tts.render(PHRASE, wav, engine, voice, speed=speed, pitch=pitch)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "160k", mp3], check=True)
            with open(mp3, "rb") as f:
                tg("sendAudio", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": label, "title": label},
                   files={"audio": (f"voice{n}.mp3", f, "audio/mpeg")})
        except Exception as e:
            tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text": f"{label}: ошибка — {str(e)[:300]}"})


if __name__ == "__main__":
    main()
