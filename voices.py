"""Тест голосов: одна фраза разными настройками, каждая сразу с фоновой музыкой."""
import os
import subprocess
import requests
import config
import tts
import music

PHRASE = ("Знаешь, сколько может прожить акула? Четыреста лет… "
          "Представь: некоторые из них плавали в океане ещё до рождения Петра Первого!")

# (голос, тон Silero, доп. сдвиг тона, темп, обработка, описание)
VARIANTS = [
    ("eugene", 1.0, 1.0, 0.96, "grandpa", "eugene, живая интонация (по умолчанию)"),
    ("eugene", 1.0, 1.0, 1.04, "grandpa", "eugene, чуть бодрее"),
    ("aidar", 1.0, 1.0, 0.96, "grandpa", "aidar, живая интонация"),
]


def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=120, **kw)
    r.raise_for_status()


def main():
    os.makedirs("work", exist_ok=True)
    music.generate("work/music.wav", 20, 7)
    for n, (voice, pitch, post, tempo, preset, desc) in enumerate(VARIANTS, 1):
        config.VOICE_TEMPO = tempo
        label = f"Вариант {n}: {desc}"
        try:
            wav, mp3 = f"work/v{n}.wav", f"work/v{n}.mp3"
            tts.render(PHRASE, wav, "silero", voice, speed=1.0, pitch=pitch, post_pitch=post, preset=preset)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "work/music.wav", "-i", wav, "-filter_complex",
                            "[1:a]adelay=1500|1500,apad,asplit=2[v][sc];[0:a]volume=1.6[m];"
                            "[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=60:release=700[md];"
                            "[md][v]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95",
                            "-b:a", "160k", mp3], check=True)
            with open(mp3, "rb") as f:
                tg("sendAudio", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": label, "title": label},
                   files={"audio": (f"voice{n}.mp3", f, "audio/mpeg")})
        except Exception as e:
            tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text": f"{label}: ошибка — {str(e)[:300]}"})


if __name__ == "__main__":
    main()
