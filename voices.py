"""Тест голосов: присылает в Telegram одну фразу разными движками и голосами (с обработкой)."""
import os
import subprocess
import requests
import config
import tts

PHRASE = ("Гренландская акула может прожить около четырёхсот лет. "
          "Некоторые из них плавали в океане ещё до рождения Петра Первого!")

# (голос Silero, тон Silero, доп. понижение тона, обработка, описание)
VARIANTS = [
    ("aidar", 0.9, 1.0, "studio", "как вариант 2 (для сравнения)"),
    ("aidar", 0.8, 1.0, "deep", "очень низкий тон + дикторская обработка"),
    ("aidar", 0.9, 0.94, "deep", "ниже на 6% + дикторская обработка"),
    ("aidar", 0.9, 0.90, "deep", "ниже на 10% + дикторская обработка"),
    ("aidar", 0.8, 0.94, "deep", "очень низкий + ниже на 6% + дикторская"),
]


def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=120, **kw)
    r.raise_for_status()


def main():
    os.makedirs("work", exist_ok=True)
    for n, (voice, pitch, post, preset, desc) in enumerate(VARIANTS, 1):
        label = f"Вариант {n}: {desc}"
        try:
            wav, mp3 = f"work/v{n}.wav", f"work/v{n}.mp3"
            tts.render(PHRASE, wav, "silero", voice, speed=1.0, pitch=pitch, post_pitch=post, preset=preset)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "160k", mp3], check=True)
            with open(mp3, "rb") as f:
                tg("sendAudio", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": label, "title": label},
                   files={"audio": (f"voice{n}.mp3", f, "audio/mpeg")})
        except Exception as e:
            tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text": f"{label}: ошибка — {str(e)[:300]}"})


if __name__ == "__main__":
    main()
