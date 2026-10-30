"""Тест голосов: присылает в Telegram одну и ту же фразу разными голосами и настройками."""
import os
import subprocess
import requests
import config
import tts

PHRASE = ("Гренландская акула может прожить около четырёхсот лет. "
          "Некоторые из них плавали в океане ещё до рождения Петра Первого!")

VARIANTS = [
    ("dmitri", 1.22, 0.90), ("dmitri", 1.35, 0.84),
    ("denis", 1.22, 0.90), ("denis", 1.35, 0.84),
    ("ruslan", 1.22, 0.90), ("ruslan", 1.35, 0.84),
]


def send_audio(path, caption):
    with open(path, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendAudio",
                          data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": caption, "title": caption},
                          files={"audio": (os.path.basename(path), f, "audio/mpeg")}, timeout=120)
    r.raise_for_status()


def main():
    os.makedirs("work", exist_ok=True)
    for n, (voice, speed, pitch) in enumerate(VARIANTS, 1):
        if not os.path.exists(f"models/{voice}.onnx"):
            continue
        wav, mp3 = f"work/v{n}.wav", f"work/v{n}.mp3"
        tts.piper(PHRASE, wav, voice=voice, speed=speed, pitch=pitch)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", mp3], check=True)
        send_audio(mp3, f"Вариант {n}: {voice}, скорость {speed}, тон {pitch}")


if __name__ == "__main__":
    main()
