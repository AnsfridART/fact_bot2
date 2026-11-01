"""Тест голосов: одна фраза разными настройками, каждая сразу с фоновой музыкой."""
import os
import subprocess
import requests
import config
import tts
import music

PHRASE = ("Он продал Эйфелеву башню. Дважды! "
          "Представь: торговец металлом поверил каждому слову… и сам отдал ему деньги.")

YANDEX_VARIANTS = [
    ("ermil", "good", "Яндекс: Ермил, дружелюбный"),
    ("ermil", "neutral", "Яндекс: Ермил, нейтральный"),
    ("filipp", "", "Яндекс: Филипп"),
    ("alexander", "", "Яндекс: Александр"),
    ("kirill", "", "Яндекс: Кирилл"),
    ("zahar", "", "Яндекс: Захар"),
    ("madirus", "", "Яндекс: Мадирус"),
]

# (движок, голос, темп, тон, описание)
VARIANTS = [
    ("edge", "ru-RU-DmitryNeural", "+0%", "-2Hz", "Дмитрий (Microsoft), спокойный темп"),
    ("edge", "ru-RU-DmitryNeural", "+6%", "-2Hz", "Дмитрий (Microsoft), чуть бодрее — по умолчанию"),
    ("edge", "ru-RU-DmitryNeural", "+10%", "+0Hz", "Дмитрий (Microsoft), энергично"),
    ("silero", "eugene", None, None, "Silero eugene — нынешний голос, для сравнения"),
]


def tg(method, **kw):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=120, **kw)
    r.raise_for_status()


def main():
    os.makedirs("work", exist_ok=True)
    music.generate("work/music.wav", 20, 7)
    variants = VARIANTS
    if config.SPEECHKIT_API_KEY:
        variants = [("yandex", v, emo, None, d) for v, emo, d in YANDEX_VARIANTS]
    for n, (engine, voice, rate, pitch, desc) in enumerate(variants, 1):
        label = f"Вариант {n}: {desc}"
        try:
            wav, mp3 = f"work/v{n}.wav", f"work/v{n}.mp3"
            if engine == "yandex":
                tts._yandex_full(PHRASE, wav, voice=voice, emotion=rate)
            elif engine == "edge":
                config.EDGE_PITCH = pitch
                tts._edge(PHRASE, wav, voice=voice, rate=rate)
            else:
                tts.render(PHRASE, wav, "silero", voice, preset="smooth")
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
