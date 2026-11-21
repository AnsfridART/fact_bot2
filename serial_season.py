"""Materialize exactly the episode unlocked by the owner's recorded decisions."""
import json
from pathlib import Path

ROOT = Path(__file__).parent / 'serial'
CTA = "выбирай в комментариях что бы сделал ты, продолжение за тобой."
SETS = {"office", "platform", "hall", "door", "car", "gate", "desk", "glass"}
PROPS = [
    ["ticket","ticket","ticket","door","train","key"],
    ["book","book","watch","door","tape","tape"],
    ["tape","tape","ticket","book","ticket","ticket"],
    ["board","board","gate","ticket","watch","gate"],
    ["gate","ticket","book","train","watch","ticket"],
]


def episode(state, chapters):
    choices = state["choices"]
    if state["season"] != "platform-zero" or len(chapters) != 5 or len(choices) > 4:
        raise ValueError("Некорректное состояние сезона")
    for i, choice in enumerate(choices):
        if choice not in chapters[i]["options"]:
            raise ValueError(f"Неизвестный результат голосования в части {i+1}")
    i = len(choices)
    ch = chapters[i]
    if len(ch["sets"]) != 6 or set(ch["sets"]) - SETS or len(ch["beats"]) != 5:
        raise ValueError("Для каждого фрагмента нужна постановка")
    def shot(text, room, prop, index):
        return {"text": text, "boarding": {"room": room, "prop": prop,
                "actor": ["vera","vera","father","vera","child","vera"][index],
                "action": ["inspect","walk","turn","reach","signal","turn"][index],
                "lens": ["detail","wide","portrait","medium","wide","medium"][index]}}
    hook = shot(ch["hook"], ch["sets"][0], PROPS[i][0], 0)
    hook["title"] = ch["hook"]
    scenes = [shot(t, ch["sets"][j], PROPS[i][j], j) for j,t in enumerate(ch["beats"],1)]
    if i:
        branch = chapters[i-1]["options"].index(choices[-1])
        text, room = ch["entry"][branch]
        scenes.insert(0, shot(text, room, PROPS[i][0], 1))
    return {"serial": True, "title": f"Билет на вчера · {i+1}/5 · {ch['title']}",
            "hook": hook,"scenes": scenes,"outro": {"text": CTA}, "options": ch["options"],
            "voice":"filipp","voice_speed":1.13,"question":ch["beats"][-1],
            "source":"Авторская фантастическая история","description":ch["hook"],
            "hashtags":["БилетНаВчера","история","выбор"],"yt_tags":"анимация, интерактивная история"}


def load_episode():
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    chapters = json.loads((ROOT / "platform-zero.json").read_text(encoding="utf-8"))
    return episode(state, chapters), chapters

def current(done_path):
    script, chapters = load_episode()
    done = set(Path(done_path).read_text(encoding="utf-8").splitlines()) if Path(done_path).exists() else set()
    state = json.loads((ROOT / "state.json").read_text(encoding="utf-8"))
    for i in range(len(state["choices"])):
        earlier = episode({**state,"choices":state["choices"][:i]}, chapters)
        if earlier["title"] not in done:
            raise ValueError("Предыдущая серия ещё не доставлена")
    return None if script["title"] in done else script


def verify_video(video, fps):
    import subprocess
    import numpy as np
    props = json.loads(Path("props.json").read_text(encoding="utf-8"))
    for seg in props["segments"]:
        samples = []
        for fraction in (.18,.62):
            t = (seg["start"] + seg["dur"] * fraction) / fps
            raw = subprocess.check_output(["ffmpeg","-v","error","-ss",str(t),"-i",str(video),
                "-frames:v","1","-vf","crop=iw:ih/3:0:ih/3,scale=108:64,format=gray",
                "-f","rawvideo","-threads","1","pipe:1"])
            pixels = np.frombuffer(raw,dtype=np.uint8).astype(float)
            if len(pixels) != 108*64 or pixels.std() < 7:
                raise ValueError(f"Пустой кадр на {t:.1f} с")
            samples.append(pixels)
        if abs(samples[0]-samples[1]).mean() < .32:
            raise ValueError(f"Неподвижная сцена с кадра {seg['start']}")
