"""Send exactly one verified film. Only retry failures known to precede the upload."""
import json
import os
import subprocess
import time
from pathlib import Path

story=json.loads(Path("tilt/story.json").read_text(encoding="utf8"))
video=next(Path("ready").rglob("doctor-bob.mp4"))
url="https://api.telegram.org/bot"+os.environ["TELEGRAM_BOT_TOKEN"]+"/sendVideo"
for attempt in range(9):
    result=subprocess.run(["curl","-4","--silent","--connect-timeout","10","--max-time","180",
        "--write-out","%{stderr}%{size_upload}","-F","chat_id="+os.environ["TELEGRAM_CHAT_ID"],
        "-F","supports_streaming=true","-F","caption=Доктор Боб · "+story["title"]+"\n"+story["caption"],
        "-F","video=@"+str(video)+";type=video/mp4",url],capture_output=True)
    if result.returncode in (6,7,35) or (result.returncode==28 and result.stderr.strip()==b"0"):
        time.sleep(min(2**attempt,7))
        continue
    if result.returncode:
        raise RuntimeError("Telegram transfer stopped: "+str(result.returncode))
    r=json.loads(result.stdout)
    if r.get("ok"):
        print("Telegram accepted video",r["result"]["message_id"])
        break
    if r.get("error_code")==429:
        time.sleep(r.get("parameters",{}).get("retry_after",5))
        continue
    raise RuntimeError("Telegram rejected upload: "+str(r.get("error_code")))
else:
    raise RuntimeError("Unable to connect before upload")
