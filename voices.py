"""v17: слепой тест голосов на тексте настоящего ролика.
Каждый вариант приходит в Telegram под номером, с музыкой и замером темпа; кто есть кто — под спойлером в конце."""
import html
import os
import subprocess
import wave
import requests
import config
import tts
import music

# хук + две сцены из «Служба безопасности банка. Часть 1» — так слышно и напор, и рассказ
HOOK = "Звонит служба безопасности банка. С карты уходят деньги."
STORY = ("Вежливый голос: «Кто-то пытается перевести сорок тысяч. Это вы?» "
         "Ты ничего не переводил. Сердце уходит в пятки. "
         "Он знает твоё имя, банк и последние цифры карты. Звучит убедительно.")

# (спецификация голоса «голос[:роль[:сдвиг тона]]», обработка, описание)
VARIANTS = [
    ("madirus", "clean", "Мадирус — нынешний голос"),
    ("filipp", "clean", "Филипп"),
    ("ermil:neutral", "clean", "Ермил, нейтральный"),
    ("zahar:neutral", "clean", "Захар, нейтральный"),
    ("alexander:neutral", "clean", "Александр, нейтральный"),
    ("anton:neutral", "clean", "Антон, нейтральный"),
    ("kirill:neutral", "clean", "Кирилл, нейтральный"),
    ("kirill:strict", "clean", "Кирилл, строгий"),
    ("kirill:strict:-120", "deep", "Кирилл, строгий, ниже тоном + «дикторская» обработка"),
    ("alexander:neutral:-120", "deep", "Александр, ниже тоном + «дикторская» обработка"),
]


def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=120, **kw)
    r.raise_for_status()


def dur(path):
    with wave.open(path) as w:
        return w.getnframes() / w.getframerate()


def main():
    os.makedirs("work", exist_ok=True)
    music.generate("work/music.wav", 30, 7, "tense")
    speed = float(os.getenv("YANDEX_SPEED", config.YANDEX_SPEED)) * 1.08  # как в нуар-роликах
    words = len((HOOK + " " + STORY).split())
    key = []
    tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text":
       "🎙 Слепой тест голосов: один и тот же текст, разные голоса. Послушай все и запиши номер лучшего "
       "(и второго места). Кто есть кто — в конце под спойлером."})
    for n, (spec, preset, desc) in enumerate(VARIANTS, 1):
        try:
            config.YANDEX_PRESET = preset
            h, b, wav, mp3 = f"work/h{n}.wav", f"work/b{n}.wav", f"work/v{n}.wav", f"work/v{n}.mp3"
            tts.yandex_say(HOOK, h, spec=spec, speed=round(speed * 1.1, 2))
            tts.yandex_say(STORY, b, spec=spec, speed=round(speed, 2))
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", h, "-i", b, "-filter_complex",
                            "[0:a]apad=pad_dur=0.25[a];[a][1:a]concat=n=2:v=0:a=1", wav], check=True)
            wps = words / dur(wav)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "work/music.wav", "-i", wav, "-filter_complex",
                            "[1:a]adelay=600|600,apad,asplit=2[v][sc];[0:a]volume=1.4[m];"
                            "[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=60:release=700[md];"
                            "[md][v]amix=inputs=2:duration=shortest:normalize=0,alimiter=limit=0.95",
                            "-t", f"{dur(wav) + 1.2:.1f}", "-b:a", "160k", mp3], check=True)
            label = f"Голос №{n}"
            with open(mp3, "rb") as f:
                tg("sendAudio", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": label, "title": label, "performer": "тест"},
                   files={"audio": (f"golos{n}.mp3", f, "audio/mpeg")})
            key.append(f"№{n} — {html.escape(desc)} · <code>{spec}</code> · {wps:.1f} слов/с")
        except Exception as e:
            key.append(f"№{n} — {html.escape(desc)}: ошибка {html.escape(str(e)[:150])}")
    tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "parse_mode": "HTML", "text":
       "Кто есть кто:\n<tg-spoiler>" + "\n".join(key) + "</tg-spoiler>\n\n"
       "Ориентир для такого жанра: 2,6–3,0 слова в секунду, низкий уверенный голос без «радио-улыбки»."})


if __name__ == "__main__":
    main()
