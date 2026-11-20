"""Mix the experiment's score, wheel foley, narration and frame-locked cues."""
import json
import math
import subprocess
import wave
from pathlib import Path

import numpy as np
import music
import tts

OUT=Path("output/tilt")
RATE=44100


def part(track, at, freq, length, volume):
    offset=round(RATE*at)
    size=min(round(RATE*length),len(track)-offset)
    if size<=0:
        return
    t=np.arange(size)/RATE
    env=np.minimum(1,t/.011)*np.exp(-t/(length*.26))*np.minimum(1,(size/RATE-t)/.04)
    phase=2*np.pi*freq*t
    track[offset:offset+size]+=volume*env*(np.sin(phase)+.19*np.sin(2*phase)+.09*np.sin(3*phase))


def score(seconds):
    mix=np.zeros(round(RATE*seconds),dtype=np.float32)
    notes=[0,7,12,3,7,10,14,7]
    beat=.32
    for i in range(int(seconds/beat)):
        at=i*beat
        if 45.5<at<55.4 or 69.1<at:
            continue
        root=[50,46,53,48][(i//16)%4]
        if i%2==0 or 19<at<46:
            part(mix,at,440*2**((root+notes[i%8]-69)/12),.26,.047 if i%4 else .064)
        if i%4==0:
            part(mix,at,440*2**((root-12-69)/12),.45,.065)
    # Uneven pairs of quiet clicks give the moving trolley its own audible rhythm.
    for at in np.arange(19.4,60,.37):
        if 26.4<at<30 or 44.5<at<55.7:
            continue
        part(mix,at,510,.055,.031)
        part(mix,at+.073,325,.063,.027)
    with wave.open(str(OUT/"score.wav"),"wb") as wav:
        wav.setparams((1,2,RATE,0,"NONE","not compressed"))
        wav.writeframes((np.clip(mix,-1,1)*32767).astype('<i2').tobytes())


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    story=json.loads(Path("tilt/story.json").read_text(encoding="utf8"))
    seconds=story["seconds"]
    score(seconds)
    music.sfx_track(str(OUT/"sfx.wav"),seconds,story["sounds"])
    inputs=["-i",OUT/"score.wav","-i",OUT/"sfx.wav"]
    filters=[]
    for i,(start,end,line) in enumerate(story["lines"]):
        wav=OUT/f"voice-{i}.wav"
        tts.yandex_say(line,str(wav),spec="filipp",speed=1.15)
        length=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",wav]))
        tempo=max(1,length/(end-start-.01))
        inputs.extend(["-i",wav])
        filters.append(f"[{i+2}:a]atempo={tempo:.5f},adelay={round(start*1000)}:all=1[v{i}]")
    streams="[0:a][1:a]"+"".join(f"[v{i}]" for i in range(len(filters)))
    filters.append(f"{streams}amix=inputs={len(filters)+2}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=8[a]")
    subprocess.run(["ffmpeg","-y","-loglevel","error",*inputs,"-filter_complex",";".join(filters),
        "-map","[a]","-ar","48000","-t",str(seconds),OUT/"mix.wav"],check=True)


if __name__=="__main__":
    main()
