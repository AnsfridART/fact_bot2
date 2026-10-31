"""Берёт следующий сценарий из queue/, готовит озвучку, картинки и данные для анимации,
рендерит ролик в Remotion и присылает его в Telegram."""
import glob
import html
import json
import os
import random
import shutil
import subprocess
import wave
import numpy as np
import requests
import config
import tts
import images
import music

FPS = config.FPS


# ---------- Telegram ----------
def tg(method, **kwargs):
    r = requests.post(f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/{method}", timeout=300, **kwargs)
    if not r.ok:
        raise RuntimeError(f"Telegram {method}: {r.text}")


def say(text):
    tg("sendMessage", data={"chat_id": config.TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML",
                            "disable_web_page_preview": "true"})


# ---------- Очередь сценариев ----------
def next_script():
    for path in sorted(glob.glob(os.path.join(config.QUEUE_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            items = json.load(f)
        # сценарии старого формата (без сцен) пропускаем
        while items and "scenes" not in items[0]:
            items = items[1:]
        if items:
            return items[0], path, items[1:]
        os.remove(path)
    return None, None, None


def remaining():
    n = 0
    for path in glob.glob(os.path.join(config.QUEUE_DIR, "*.json")):
        with open(path, encoding="utf-8") as f:
            n += len(json.load(f))
    return n


# ---------- Анализ звука ----------
def audio_info(path):
    """Длительность в кадрах и громкость по кадрам (0..1) для движения рта."""
    with wave.open(path) as w:
        sr, n = w.getframerate(), w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)
    hop = sr / FPS
    frames = int(np.ceil(len(data) / hop))
    env = np.array([np.sqrt(np.mean(data[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-9) for i in range(frames)])
    ref = np.percentile(env, 95) or 1
    env = np.clip(env / ref, 0, 1)
    env[env < 0.12] = 0
    env = np.convolve(env, [0.25, 0.5, 0.25], mode="same")
    # найдём, где реально начинается и заканчивается речь
    voiced = np.where(env > 0.15)[0]
    first, last = (int(voiced[0]), int(voiced[-1])) if len(voiced) else (0, frames)
    return frames, [round(float(x), 3) for x in env], first, last


def word_timings(text, first, last):
    """Распределяем слова по времени речи пропорционально длине. *слово* = ключевое (красное)."""
    words = text.replace("\u00a0", " ").split()
    weights = [len(w.strip(".,!?«»—:;*…")) + 2 for w in words]
    total, span, t, out = sum(weights), max(1, last - first), float(first), []
    for w, k in zip(words, weights):
        d = span * k / total
        out.append({"w": w.replace("*", "").strip("«»"), "key": "*" in w, "s": int(t), "e": int(t + d)})
        t += d
    return out


def clean(text):
    return text.replace("*", "").replace("|", " ")


# ---------- Сборка данных ----------
def build_props(s):
    if os.path.isdir(config.PUBLIC_DIR):
        shutil.rmtree(config.PUBLIC_DIR)
    os.makedirs(config.PUBLIC_DIR)

    plan = [{"kind": "intro", "text": s["intro"]["text"], "title": s["intro"].get("title"), "emotion": "enter"}]
    for sc in s["scenes"]:
        plan.append({"kind": "scene", **sc})
    if s.get("punch"):
        plan.append({"kind": "punch", "text": s["punch"]["text"], "big": s["punch"]["big"]})
    plan.append({"kind": "outro", "emotion": "wave",
                 "text": (s.get("outro") or {}).get("text", "Подпишись, завтра расскажу историю ещё безумнее!")})

    seed = random.randint(1, 10_000_000)
    segments, start = [], 0
    for i, p in enumerate(plan):
        wav = f"seg{i}.wav"
        tts.synthesize(clean(p["text"]), os.path.join(config.PUBLIC_DIR, wav))
        frames, env, first, last = audio_info(os.path.join(config.PUBLIC_DIR, wav))
        gap = 0.12 if p["kind"] == "scene" else 0.35
        dur = max(frames + int(gap * FPS), int(1.6 * FPS))
        seg = {"kind": p["kind"], "start": start, "dur": dur, "audio": wav, "env": env,
               "words": word_timings(p["text"].replace("|", " "), first, last)}
        for k in ("title", "emotion", "tag", "alert", "cam", "big", "bg", "actors", "focus", "tint", "camY"):
            if p.get(k):
                seg[k] = p[k]
        if p["kind"] == "scene" and not (p.get("bg") or p.get("actors")):
            img = f"img{i}.jpg"
            try:
                images.generate(p["prompt"], os.path.join(config.PUBLIC_DIR, img), seed, p.get("stock", ""))
                seg["image"] = img
            except Exception as e:
                print("Картинка не получилась:", e)
                prev = next((x["image"] for x in reversed(segments) if x.get("image")), None)
                if prev:
                    seg["image"] = prev
        segments.append(seg)
        start += dur

    props = {"segments": segments, "totalFrames": start}
    # музыка: свои треки из папки music/, иначе генерируем загадочный эмбиент (подмешивается после рендера)
    tracks = glob.glob(os.path.join(config.MUSIC_DIR, "*.mp3"))
    try:
        if tracks:
            shutil.copy(random.choice(tracks), "work_music.audio")
        else:
            music.generate("work_music.audio.wav", start / FPS + 1, seed)
            shutil.move("work_music.audio.wav", "work_music.audio")
    except Exception as e:
        print("Музыка не получилась:", e)
    with open("props.json", "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False)
    return props


def add_music(video):
    """Подмешивает музыку: она приглушается, когда звучит голос, и громче в паузах."""
    if not os.path.exists("work_music.audio"):
        return video
    out = video.replace(".mp4", "_music.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-stream_loop", "-1", "-i", "work_music.audio",
                    "-filter_complex",
                    "[0:a]asplit=2[v][sc];"
                    "[1:a]volume=1.6[m];"
                    "[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=60:release=700[md];"
                    "[v][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out],
                   check=True)
    return out


def render():
    os.makedirs(os.path.dirname(config.OUTPUT), exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "src/index.jsx", "Main", config.OUTPUT,
                    "--props=./props.json", "--concurrency=100%", "--crf=20",
                    "--timeout=120000", "--log=warn"], check=True)
    try:
        final = add_music(config.OUTPUT)
        shutil.move(final, config.OUTPUT)
    except Exception as e:
        print("Не удалось подмешать музыку:", e)
    # Telegram-боты отправляют файлы до 50 МБ: если больше, пережимаем
    if os.path.getsize(config.OUTPUT) > 48 * 1024 * 1024:
        small = config.OUTPUT.replace(".mp4", "_tg.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", config.OUTPUT, "-c:v", "libx264",
                        "-crf", "28", "-preset", "medium", "-c:a", "aac", small], check=True)
        return small
    return config.OUTPUT


def caption(s):
    tags = " ".join("#" + t.lstrip("#").replace(" ", "") for t in s.get("hashtags", []))
    return f"{s['title']}\n\n{tags}"


def main():
    s, path, rest = next_script()
    if s is None:
        say("📭 Сценарии закончились. Попроси у Claude новую пачку и загрузи файл в папку queue.")
        return

    build_props(s)
    video = render()

    story = " ".join(clean(sc["text"]) for sc in s["scenes"])
    say(f"<b>{html.escape(s['title'])}</b>\n\n{html.escape(story)}\n\n"
        f"<i>Источник: {html.escape(s.get('source', '?'))}</i>")
    with open(video, "rb") as fh:
        tg("sendVideo", data={"chat_id": config.TELEGRAM_CHAT_ID, "supports_streaming": "true"},
           files={"video": ("video.mp4", fh, "video/mp4")})
    say("Подпись для публикации:\n\n"
        f"<code>{html.escape(caption(s))}</code>\n\n"
        f"Описание для YouTube:\n<code>{html.escape(s.get('description', ''))}</code>")

    if rest:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rest, f, ensure_ascii=False, indent=1)
    else:
        os.remove(path)
    with open(config.DONE_FILE, "a", encoding="utf-8") as f:
        f.write(s["title"] + "\n")
    left = remaining()
    if left <= 3:
        say(f"⚠️ В очереди осталось сценариев: {left}. Пора попросить у Claude новую пачку.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        try:
            say(f"❌ Ошибка при создании ролика: {html.escape(str(e))[:3000]}")
        finally:
            raise
