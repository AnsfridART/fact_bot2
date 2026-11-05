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


WARNINGS = []  # проблемы, о которых стоит написать в Telegram вместе с роликом


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
        # пропускаем старый формат и уже вышедшие истории
        done = set()
        if os.path.exists(config.DONE_FILE):
            with open(config.DONE_FILE, encoding="utf-8") as fh:
                done = {line.strip() for line in fh}
        while items and ("scenes" not in items[0] or items[0]["title"].strip() in done):
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
        out.append({"w": w.replace("*", "").replace("«", "").replace("»", ""), "key": "*" in w, "s": int(t), "e": int(t + d)})
        t += d
    return out


def clean(text):
    return text.replace("*", "").replace("|", " ")


# ---------- Сборка данных ----------
def build_props(s):
    if os.path.isdir(config.PUBLIC_DIR):
        shutil.rmtree(config.PUBLIC_DIR)
    os.makedirs(config.PUBLIC_DIR)

    noir = s.get("style") == "noir"
    # холодный старт: сразу сцена с действием и крупным заголовком; старый формат — профессор во вступлении
    if s.get("hook"):
        plan = [{"kind": "hook", **s["hook"]}]
    else:
        plan = [{"kind": "intro", "text": s["intro"]["text"], "title": s["intro"].get("title"), "emotion": "enter"}]
    for sc in s["scenes"]:
        plan.append({"kind": "scene", **sc})
    if s.get("choice"):  # v15: экран выбора «а что сделал бы ты?» перед развязкой
        c = s["choice"]
        plan.append({"kind": "choice", "text": c["text"], "options": c.get("options", []),
                     "question": c.get("question"), "hint": c.get("hint"), "next": c.get("next"), "clue": c.get("clue"), "nextTitle": c.get("next_title")})
    if s.get("punch"):
        plan.append({"kind": "punch", "text": s["punch"]["text"], "big": s["punch"]["big"]})
    if not noir or s.get("outro"):  # в нуар-стиле профессор не выходит, если outro не задан явно
        plan.append({"kind": "outro", "emotion": "wave",
                     "text": (s.get("outro") or {}).get("text", "Это был Доктор Боб. Подпишись, завтра история ещё безумнее!")})
    # словесная петля: последняя фраза обрывается и «продолжается» первой фразой ролика
    if s.get("loop") and s.get("hook"):
        plan.append({"kind": "loop", "text": s["loop"]})

    seed = random.randint(1, 10_000_000)
    segments, start = [], 0
    for i, p in enumerate(plan):
        wav = f"seg{i}.wav"
        # v15: хук звучит быстрее и напористее остальных фраз; у истории может быть свой голос и темп
        mul = float(s.get("voice_speed", 1.08 if noir else 1.0)) * (1.1 if p["kind"] == "hook" else 1.0)
        tts.synthesize(clean(p["text"]), os.path.join(config.PUBLIC_DIR, wav), speed_mul=mul, voice=s.get("voice"))
        frames, env, first, last = audio_info(os.path.join(config.PUBLIC_DIR, wav))
        gap = 0.0 if p["kind"] == "loop" else 0.12 if p["kind"] in ("scene", "hook") else 0.9 if p["kind"] == "choice" else 0.35
        dur = max(frames + int(gap * FPS), int(1.6 * FPS)) + int(float(p.get("hold", 0)) * FPS)  # v16: «правила» держим дольше, чтобы успели прочитать
        seg = {"kind": p["kind"], "start": start, "dur": dur, "audio": wav, "env": env,
               "words": word_timings(p["text"].replace("|", " "), first, last)}
        for k in ("title", "emotion", "tag", "alert", "cam", "big", "bg", "actors", "focus", "tint", "camY", "insert", "count", "map", "angle", "weather", "lights",
                  "ui", "hud", "uiAt", "options", "question", "hint", "next", "clue", "nextTitle", "tape"):
            if p.get(k) is not None:  # focus=0 — тоже значение
                seg[k] = p[k]
        if p["kind"] in ("scene", "hook") and not (p.get("bg") or p.get("actors") or p.get("map") or p.get("ui")):
            img = f"img{i}.jpg"
            try:
                images.generate(p["prompt"], os.path.join(config.PUBLIC_DIR, img), seed, p.get("stock", ""))
                seg["image"] = img
            except Exception as e:
                print("Картинка не получилась:", e)
                prev = next((x["image"] for x in reversed(segments) if x.get("image")), None)
                if prev:
                    seg["image"] = prev
        if p["kind"] == "hook" and dur > 3.5 * FPS:  # v14: длинный хук — главная причина ухода в первые секунды
            WARNINGS.append(f"хук длится {dur / FPS:.1f} с (лучше до 3 с): «{clean(p['text'])}»")
        segments.append(seg)
        start += dur

    props = {"segments": segments, "totalFrames": start}
    if noir:
        props["style"] = "noir"
        props["hudLabels"] = s.get("hud_labels")
        props["part"] = s.get("part")
        props["theme"] = s.get("theme", "noir")
    # музыка: свои треки из папки music/, иначе генерируем загадочный эмбиент (подмешивается после рендера)
    tracks = glob.glob(os.path.join(config.MUSIC_DIR, "*.mp3"))
    try:
        if tracks:
            shutil.copy(random.choice(tracks), "work_music.audio")
        else:
            theme_mood = {"dossier": "mystery", "silence": "mystery", "storm": "epic"}.get(s.get("theme"), "tense")
            music.generate("work_music.audio.wav", start / FPS + 1, seed, s.get("mood", theme_mood if noir else "mystery"))
            # атмосфера мест подмешивается к музыке, чтобы вместе приглушаться под голос
            music.ambience_track("work_amb.wav", segments, FPS, start / FPS)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "work_music.audio.wav", "-i", "work_amb.wav",
                            "-filter_complex", "[1:a]volume=0.45,aresample=44100,aformat=channel_layouts=stereo[a];"
                            "[0:a][a]amix=inputs=2:duration=first:normalize=0", "-f", "wav", "work_music.audio"], check=True)
    except Exception as e:
        print("Музыка не получилась:", e)
        WARNINGS.append(f"музыка не сгенерировалась: {e}")
    # звуковые эффекты: удар + свуш на первом кадре, свуш на смене сцен, удар на финальной фразе
    try:
        ev = [(0.0, "boom", 0.8), (0.0, "whoosh", 0.6)]
        if noir and segments:  # уведомление в хуке
            h = segments[0]
            hu = h.get("ui") or []
            for u in (hu if isinstance(hu, list) else [hu]):
                if u.get("type") == "notify":
                    ev.append((0.05, "ping", 0.9))  # v15.1: уведомление на первом кадре
        for sg in segments[1:]:
            t0 = sg["start"] / FPS
            if sg["kind"] == "scene":
                ev.append((max(0, t0 - 0.15), "whoosh", 0.28))
            elif sg["kind"] == "punch":
                ev.append((t0, "boom", 0.9))
            if sg.get("alert"):
                ev.append((t0 + 0.3, "tick", 0.5))
            if sg.get("insert"):  # свуш на вставке крупного плана + звук предмета
                ti = t0 + sg["dur"] * sg["insert"].get("at", 0.55) / FPS
                ev.append((ti - 0.1, "whoosh", 0.35))
                name = sg["insert"].get("name")
                extra = {"document": [(6 / FPS, "stamp", 0.8), (0.0, "paper", 0.5)], "money": [(0.1, "paper", 0.6)],
                         "letter": [(0.2, "paper", 0.6)], "seeds": [(0.1, "paper", 0.4)], "rope": [(18 / FPS, "snap", 0.9)],
                         "clock": [(0.0, "clock", 0.6)], "fire": [(0.0, "fire", 0.7)]}.get(name, [])
                ev += [(ti + dt, kind, vol) for dt, kind, vol in extra]
            for a in sg.get("actors", []) or []:
                if a.get("kind") == "lightning":  # гром на каждой вспышке молнии
                    every = (a.get("props") or {}).get("every", 40)
                    ev += [(t0 + k / FPS, "thunder", 0.8) for k in range(0, sg["dur"], every)]
                if a.get("anim") == "fly" and a.get("kind") in ("crow", "crows"):
                    ev.append((t0 + 0.1, "wings", 0.6))
            if noir:  # v15: звуки интерфейсов и монтажа
                if sg["kind"] in ("scene", "choice") and t0 > 0:
                    ev.append((t0, "glitch", 0.45))
                uis = sg.get("ui") or []
                uis = uis if isinstance(uis, list) else [uis]
                has_stage = bool(sg.get("actors") or sg.get("bg"))
                over = [u for u in uis if has_stage and u.get("type") == "notify"]
                full = [u for u in uis if u not in over]
                ui0 = 0 if not has_stage else (int(sg["dur"] * sg.get("uiAt", 0.45)) if full else sg["dur"])
                for u in over:
                    ev.append((t0 + int(sg["dur"] * u.get("at", 0.12 if sg["kind"] == "hook" else 0.25)) / FPS, "ping", 0.8))
                share = (sg["dur"] - ui0) / max(1, len(full))
                for j, u in enumerate(full):
                    tu = t0 + (ui0 + j * share) / FPS
                    if ui0 + j * share > 0:
                        ev.append((tu, "whoosh", 0.3))
                    kind = u.get("type")
                    if kind == "notify":
                        ev.append((tu, "ping", 0.8))
                    elif kind in ("card", "doc", "chain") and (kind != "doc" or u.get("stamp")):
                        ev.append((tu + (40 if kind == "chain" else 15) / FPS, "stamp", 0.9))
                    elif kind in ("wallet", "alert"):
                        ev += [(tu + (8 + i * 2.5) / FPS, "tick", 0.18) for i in range(14)]
                        ev.append((tu + 48 / FPS, "boom", 0.45))
                    elif kind == "chat":
                        n = len(u.get("msgs", []))
                        step = max(10, int(share * 0.75 / max(1, n)))
                        ev += [(tu + (6 + i * step) / FPS, "ping", 0.35) for i in range(n)]
                    elif kind == "call":
                        ev += [(tu + k * 0.8, "ping", 0.5) for k in range(int(share / FPS / 0.8) + 1)]
                    elif kind == "timer":
                        ev += [(tu + k, "clock", 0.5) for k in range(int(share / FPS) + 1)]
                if sg["kind"] == "choice":
                    n = len(sg.get("options", []))
                    step = max(8, int(sg["dur"] * 0.55 / max(1, n)))
                    ev += [(t0 + (6 + i * step) / FPS, "tick", 0.6) for i in range(n)]
            if sg.get("count"):   # тиканье счётчика и удар в конце
                c0 = t0 + sg["dur"] * sg["count"].get("at", 0.12) / FPS
                ev += [(c0 + i * 0.07, "tick", 0.25) for i in range(16)]
                ev.append((c0 + 34 / FPS, "boom", 0.5))
        music.sfx_track("work_sfx.wav", start / FPS, ev)
    except Exception as e:
        print("Звуковые эффекты не получились:", e)
    with open("props.json", "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False)
    return props


def add_music(video):
    """Подмешивает музыку (приглушается под голос) и звуковые эффекты."""
    has_music = os.path.exists("work_music.audio")
    has_sfx = os.path.exists("work_sfx.wav")
    if not has_music and not has_sfx:
        raise RuntimeError("нет ни музыки, ни эффектов")
    out = video.replace(".mp4", "_music.mp4")
    fmt = "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
    inputs = ["-i", video]
    if has_music:
        inputs += ["-stream_loop", "-1", "-i", "work_music.audio"]
    if has_sfx:
        inputs += ["-i", "work_sfx.wav"]
    fx_in = f"[{2 if has_music else 1}:a]{fmt},volume=0.9[fx];" if has_sfx else ""
    fx = "[fx]" if has_sfx else ""
    n = 1 + int(has_music) + int(has_sfx)
    tail = f"amix=inputs={n}:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.95[a]"  # громкость как у роликов в TikTok
    if has_music:
        graphs = (
            f"[0:a]{fmt},asplit=2[v][sc];[1:a]{fmt},volume=1.6[m];{fx_in}"
            f"[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=60:release=700[md];[v][md]{fx}{tail}",
            f"[0:a]{fmt}[v];[1:a]{fmt},volume=0.55[m];{fx_in}[v][m]{fx}{tail}",
        )
    else:
        graphs = (f"[0:a]{fmt}[v];{fx_in}[v]{fx}{tail}",)
    last_err = None
    for graph in graphs:
        r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", graph,
                            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out],
                           capture_output=True, text=True)
        if r.returncode == 0:
            return out
        last_err = r.stderr[-400:]
        print("Смешивание не удалось:", last_err)
    raise RuntimeError(last_err)


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
        WARNINGS.append(f"музыка не добавлена: {str(e)[:300]}")
    # Telegram-боты отправляют файлы до 50 МБ: если больше, пережимаем
    if os.path.getsize(config.OUTPUT) > 48 * 1024 * 1024:
        small = config.OUTPUT.replace(".mp4", "_tg.mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", config.OUTPUT, "-c:v", "libx264",
                        "-crf", "28", "-preset", "medium", "-c:a", "aac", small], check=True)
        return small
    return config.OUTPUT


COVER_FILE = "cover_number.txt"


def cover_number():
    try:
        with open(COVER_FILE) as f:
            return int(f.read().strip())
    except Exception:
        return int(os.getenv("COVER_START", "1"))


def make_cover(s):
    """Обложка в стиле канала: кадр из начала истории, плашка «ИСТОРИЯ #N» и заголовок."""
    n = cover_number()
    with open("props.json", encoding="utf-8") as f:
        props = json.load(f)
    props["coverNumber"] = n
    with open("props_cover.json", "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False)
    out = "output/cover.png"
    subprocess.run(["npx", "remotion", "still", "src/index.jsx", "Cover", out, "--props=./props_cover.json",
                    "--timeout=120000", "--log=warn"], check=True)
    with open(COVER_FILE, "w") as f:
        f.write(str(n + 1))
    return out


def caption(s):
    tags = " ".join("#" + t.lstrip("#").replace(" ", "") for t in s.get("hashtags", []))
    q = f"\n\n{s['question']}" if s.get("question") else ""
    return f"{s['title']}{q}\n\n{tags}"


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
    try:
        cover = make_cover(s)
        with open(cover, "rb") as fh:  # файлом, чтобы TikTok получил полное качество
            tg("sendDocument", data={"chat_id": config.TELEGRAM_CHAT_ID, "caption": "Обложка для ролика"},
               files={"document": ("cover.png", fh, "image/png")})
    except Exception as e:
        print("Обложка не получилась:", e)
        WARNINGS.append(f"обложка не получилась: {str(e)[:200]}")
    say("Подпись для публикации:\n\n"
        f"<code>{html.escape(caption(s))}</code>\n\n"
        f"Описание для YouTube:\n<code>{html.escape(s.get('description', ''))}</code>"
        + (f"\n\nТеги для YouTube:\n<code>{html.escape(s['yt_tags'])}</code>" if s.get("yt_tags") else ""))

    if rest:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rest, f, ensure_ascii=False, indent=1)
    else:
        os.remove(path)
    with open(config.DONE_FILE, "a", encoding="utf-8") as f:
        f.write(s["title"] + "\n")
    if WARNINGS:
        say("⚠️ " + html.escape("; ".join(WARNINGS)))
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
