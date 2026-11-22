"""Render a graphic film mystery from a frame-accurate narration plan."""
import json, math, subprocess, sys, textwrap
from pathlib import Path
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

W,H=540,960
BG='#162831'; PAPER='#f3dfb7'; GOLD='#ffbf57'; RED='#ef7059'; TEAL='#59b5a9'; DARK='#192f37'
@lru_cache(None)
def font(size,bold=True):
    return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if bold else '')+'.ttf',size)
def smooth(x):
    x=max(0,min(1,x))
    return x*x*(3-2*x)
def paint(kind,p,t,caption):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    def txt(x,y,msg,n=23,col=PAPER,anchor='mm'):
        d.text((x,y),msg,font=font(n),fill=col,anchor=anchor)
    def rect(x,y,w,h,col,rad=6):
        d.rounded_rectangle((x,y,x+w,y+h),rad,fill=col)
    def line(a,b,col,w=4):d.line([a,b],fill=col,width=w)
    def oval(x,y,r,col):d.ellipse((x-r,y-r,x+r,y+r),fill=col)
    def ticket(x,y):
        rect(x,y,180,78,PAPER); txt(x+90,y+39,'СПРОСИ МЕНЯ',16,DARK)
    def strip(x,y,w,h):
        rect(x,y,w,h,'#0c1d24')
        for k in range(x+4,x+w-4,19):
            for Y in [y+5,y+h-12]:rect(k,Y,10,6,PAPER,1)
    def diver(x,y,u):
        oval(x,y,8,DARK);line((x,y+8),(x+11,y+30),DARK,8)
        for a,b in [((x+6,y+16),(x-14,y+6)),((x+7,y+16),(x+24,y+6)),((x+10,y+30),(x+26,y+40)),((x+12,y+30),(x-3,y+44))]:line(a,b,DARK,5)
    for y in range(0,H,32):line((0,y),(W,y),'#1b3038',1)
    txt(38,88,'Л У Ч    /    К И Н О А Р Х И В',15,TEAL,'lm')
    txt(38,133,'Последний сеанс',35,PAPER,'lm');txt(500,137,'1 / 5',20,GOLD,'rm')
    line((38,181),(502,181),'#456169',2)
    q=smooth(p); swing=math.sin(t*3)
    if kind=='screen':
        strip(34,245,472,325);rect(58,273,424,270,PAPER)
        if t<1.5:
            rect(58,468,424,75,TEAL);rect(58,404,152,12,DARK)
            u=min(1,t/.95);diver(183+int(90*u),355+int(58*u*u-30*math.sin(u*math.pi)),u)
        else:txt(270,405,'КОНЕЦ',65,DARK)
        txt(270,617,'ПРОБНЫЙ ПОКАЗ',20,GOLD)
    elif kind=='clock':
        oval(270,416,140,'#29464f');oval(270,416,125,DARK)
        for i in range(60):
            a=i*math.pi/30;line((270+111*math.sin(a),416-111*math.cos(a)),(270+119*math.sin(a),416-119*math.cos(a)),TEAL,2)
        txt(270,412,'11:%02d'%(59-int(t)%60),62);txt(270,475,'ДО СЕАНСА',17,GOLD)
        txt(270,620,'СЕГОДНЯ  •  ПОСЛЕДНИЙ ПОКАЗ',20)
    elif kind=='splice':
        strip(16,323,508,190)
        for x in [29,184,339]:rect(x,348,145,139,PAPER)
        diver(78,383,0);diver(238,376,0);txt(410,418,'КОНЕЦ',24,DARK)
        x=326+int(7*swing);line((x,336),(x-21,502),RED,8);txt(270,577,'СКЛЕЙКА',27,RED)
    elif kind=='box':
        for r in range(151,125,-5):oval(270,420,r,'#405c61' if r%2 else '#829493')
        txt(270,420,'1 / 2',65,GOLD)
        rect(160+int(232*q),385,214,72,PAPER);txt(267+int(232*q),420,'НАШЕ ЛЕТО',23,DARK)
    elif kind=='shelf':
        for y in [346,499]:rect(32,y,476,17,'#bd8b56')
        for x in [100,210,426]:oval(x,443,53,'#78908b');oval(x,443,42,'#465e60');oval(x,443,8,GOLD)
        d.ellipse((267,391,370,493),outline=PAPER,width=3);txt(318,444,'?',39,RED);txt(270,571,'АРХИВ   /   ПОЛКА 02',23)
    elif kind=='ledger':
        rect(49,267,442,331,PAPER);txt(270,313,'ЖУРНАЛ ВЫДАЧИ',26,DARK)
        for y in range(369,566,49):line((72,y),(469,y),'#ac9c7d',2)
        txt(270,403,'«Луч»   •   лето   •   II',26,DARK)
        x=286;d.polygon([(x,522),(x+35,462),(x+35,522)],fill=RED);line((276,527),(366,527),DARK,5)
        line((80,431),(81+350*q,431),RED,4)
    elif kind=='seat':
        for x in [-68,139,346]:
            rect(x,310,183,175,'#a34740',27);rect(x+8,483,167,36,'#cb6752',14)
        rect(160,413,145,94,'#38716c',17);d.arc((189,375,267,456),180,360,fill=GOLD,width=7)
        ticket(174+int(16*q),458-int(44*q))
    else:
        rect(49,288,442,276,'#243f47')
        d.line([(95,348),(182,348),(270,481),(358,348),(446,348)],fill=PAPER,width=7)
        for x,col in [(96,TEAL),(445,GOLD)]:oval(x,348,12,col)
        oval(270,482,12+int(3*swing),RED);txt(111,396,'К РЕКЕ',18,TEAL);txt(413,396,'НАВЕРХ',18,GOLD)
        txt(270,604,'04:00   /   ДО СЕАНСА',26)
    lines=textwrap.wrap(caption,width=25)
    for i,s in enumerate(lines):txt(270,724+i*43,s,30,GOLD if i==0 else PAPER)
    return im
if __name__=='__main__':
    beats=dict(json.loads(Path('reel/pilot.json').read_text()))
    plan=json.loads(Path('plan.json').read_text())
    proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','540x960','-r','20','-i','-','-i','voice.wav','-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart','film.mp4'],stdin=subprocess.PIPE)
    for kind,start,end in plan:
        words=beats[kind].split(); chunks=textwrap.wrap(' '.join(words),width=32,break_long_words=False)
        for i in range(end-start+1):
            p=i/max(1,end-start); offset=p*sum(map(len,chunks));cap=chunks[-1]
            for frag in chunks:
                if offset<len(frag):cap=frag;break
                offset-=len(frag)
            im=paint(kind,p,i/20,cap)
            if kind=='screen' and i==8:im.save('cover.jpg')
            proc.stdin.write(im.tobytes())
    proc.stdin.close();sys.exit(proc.wait())
