"""Render an isolated clinic screen test. All generated media lives in output/clinic."""
import argparse
import json
import subprocess
import time
from pathlib import Path

import config
import music
import tts
from run import tg


def call(*args):
    subprocess.run(list(map(str, args)), check=True)


def prepare(story, out):
    started = time.monotonic()
    seconds = story["frames"] / 30
    effects = out / "effects.wav"
    music.sfx_track(str(effects), seconds, story["sounds"])
    inputs = ["-i", effects]
    filters = []
    for number, (start, end, line) in enumerate(story["lines"], 1):
        wav = out / f"line-{number}.wav"
        tts.synthesize(line, str(wav), voice="madirus")
        length = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "csv=p=0", wav]))
        speed = max(1, length / ((end - start) / 30))
        inputs.extend(["-i", wav])
        filters.append(f"[{number}:a]atempo={speed:.5f},adelay={round(start*1000/30)}:all=1[v{number}]")
    streams = "[0:a]" + "".join(f"[v{i}]" for i in range(1, len(filters)+1))
    filters.append(f"{streams}amix=inputs={len(filters)+1}:normalize=0,alimiter=limit=0.92[a]")
    call("ffmpeg","-loglevel","error","-y",*inputs,"-filter_complex",";".join(filters),
         "-map","[a]","-t",seconds,"-ar","48000",out/"mix.wav")
    before = time.monotonic()
    call("npx","--no-install","remotion","render","clinic/entry.jsx",story["id"],out/"silent.mp4",
         "--concurrency=2","--gl=swangle","--crf=18","--log=warn","--timeout=120000")
    render_seconds = time.monotonic()-before
    call("ffmpeg","-loglevel","error","-y","-i",out/"silent.mp4","-i",out/"mix.wav",
         "-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-movflags","+faststart",out/"preview.mp4")
    call("ffmpeg","-loglevel","error","-y","-i",out/"preview.mp4","-frames:v","1",out/"cover.png")
    info = json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-of","json",out/"preview.mp4"]))
    v = next(x for x in info["streams"] if x["codec_type"]=="video")
    assert int(v["nb_frames"]) == story["frames"] and (v["width"],v["height"]) == (1080,1920)
    assert any(x["codec_type"] == "audio" for x in info["streams"])
    # Check for blank frames and record storyboard stills sampled from the actual encode.
    from PIL import Image, ImageStat
    from io import BytesIO
    sheet = Image.new("RGB", (180*5,320))
    for i, fraction in enumerate([0,.14,.37,.68,.85]):
        png = subprocess.check_output(["ffmpeg","-loglevel","error","-ss",str(seconds*fraction),
            "-i",out/"preview.mp4","-frames:v","1","-vf","scale=180:320","-f","image2pipe","-vcodec","png","-"])
        im = Image.open(BytesIO(png)).convert("RGB")
        center = im.crop((12,88,167,212)).convert("L")
        stats = ImageStat.Stat(center)
        if stats.stddev[0] < 7 or stats.mean[0] < 45:
            raise ValueError(f"Empty or dark frame at {fraction}: {stats.mean}, {stats.stddev}")
        sheet.paste(im,(180*i,0))
    sheet.save(out/"storyboard.jpg",quality=91)
    print(f'{story["id"]}: render {render_seconds:.1f}s; preparation {time.monotonic()-started:.1f}s',flush=True)


def deliver(story,out):
    with (out/"preview.mp4").open("rb") as stream:
        tg("sendVideo", data={"chat_id":config.TELEGRAM_CHAT_ID,"supports_streaming":"true",
            "caption":f'Проба · Доктор Боб · {story["title"]}\n{story["caption"]}'},
            files={"video":(story["id"]+".mp4",stream,"video/mp4")})
    with (out/"cover.png").open("rb") as stream:
        tg("sendDocument",data={"chat_id":config.TELEGRAM_CHAT_ID,"caption":"Обложка · "+story["title"]},
            files={"document":(story["id"]+".png",stream,"image/png")})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("id",choices=["clock","magnet","mirror"])
    parser.add_argument("action",choices=["prepare","deliver"])
    args = parser.parse_args()
    story = next(s for s in json.loads(Path("clinic/stories.json").read_text(encoding="utf8")) if s["id"]==args.id)
    out = Path("output/clinic")/args.id
    out.mkdir(parents=True,exist_ok=True)
    if args.action=="prepare":
        prepare(story,out)
    else:
        deliver(story,out)
