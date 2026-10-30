"""Тест голосов: присылает в Telegram одну фразу разными движками и голосами (с обработкой)."""
import os
import subprocess
import requests
import config
import tts
import music

PHRASE = ("Гренландская акула может прожить около четырёхсот лет. "
          "Некоторые из них плавали в океане ещё до рождения Петра Первого!")

# (голос Silero, тон Silero, доп. понижение тона, обработка, описание)
VARIANTS = [
    ("aidar", 0.9, 0.97, "deep", "дикторская обработка, тон чуть ниже обычного"),
    ("aidar", 0.9, 1.00, "deep", "дикторская обработка, обычный тон"),
    ("aidar", 0.9, 0.95, "deep", "дикторская обработка, тон пониже"),
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

    # пример: голос + загадочная музыка с приглушением под голос
    try:
        voice, bg, mix = "work/v1.wav", "work/music.wav", "work/mix.mp3"
        music.generate(bg, 20, 7)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", bg, "-i", voice, "-filter_complex",
                        "[1:a]adelay=1500|1500,apad,asplit=2[v][sc];"
                        "[0:a][sc]sidechaincompress=threshold=0.03:ratio=6:attack=50:release=600[bgd];"
                        "[bgd][v]amix=inputs=2:duration=first:normalize=0,volume=1.2",
                        "-b:a", "160k", mix], check=True)
        with open(mix, "rb") as f:
            tg("sendAudio", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": "Пример: вариант 1 + музыка",
                                  "title": "Голос + музыка"}, files={"audio": ("mix.mp3", f, "audio/mpeg")})
    except Exception as e:
        tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text": f"Пример с музыкой: ошибка — {str(e)[:300]}"})


if __name__ == "__main__":
    main()
