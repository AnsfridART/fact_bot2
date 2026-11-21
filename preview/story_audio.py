import json, math, wave, subprocess, textwrap
from pathlib import Path

import tts

fps = 20
rate = 48000
frame_samples = rate // fps
beats = json.loads(Path("preview/key_story.json").read_text())
lines, plan, pcm = [], [], bytearray()
def stamp(seconds):
    ms = round(1000 * seconds)
    return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}"
for kind, text in beats:
    filename = "voice-" + kind + ".wav"
    tts.synthesize(text, filename, voice="filipp")
    samples = subprocess.check_output(["ffmpeg","-loglevel","error","-i",filename,"-ar",str(rate),"-ac","1","-f","s16le","-"])
    start = len(pcm)//(2*frame_samples)
    pcm.extend(samples)
    end = math.ceil((len(pcm)/2 + rate*.20)/frame_samples)
    pcm.extend(bytes(end*frame_samples*2-len(pcm)))
    plan.append([kind,start+1,end])
    chunks=textwrap.wrap(text,width=32,break_long_words=False)
    total=sum(map(len,chunks))
    offset=0
    for chunk in chunks:
        t0=start/fps+offset/total*len(samples)/(2*rate)
        offset+=len(chunk)
        t1=start/fps+offset/total*len(samples)/(2*rate)
        lines.append(f"{len(lines)+1}\n{stamp(t0)} --> {stamp(t1)}\n{chunk}\n")
with wave.open("voice.wav","wb") as w:
    w.setparams((1,2,rate,0,"NONE",""));w.writeframes(pcm)
Path("plan.json").write_text(json.dumps(plan))
Path("captions.srt").write_text("\n".join(lines),encoding="utf-8")
if len(pcm)/(2*rate)<60:
    raise ValueError("Episode shorter than a minute")
