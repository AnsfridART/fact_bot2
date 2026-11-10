"""v25: пилот 3D — история «Ваш сын в беде», каждая сцена — свой кадр на кухне (движок src/three)."""
import json, sys
from make_thrillers_v23 import S

s = json.loads(json.dumps(S[0], ensure_ascii=False))
MOM = {"skin": "#e3b08d", "shirt": "#5a3a4a", "pants": "#2a2630", "shoes": "#141012", "hair": "#7a6656", "hairStyle": "bun"}
CAST = {"mom": MOM, "son": "man"}
PLAN = {  # сцена → (шот, uiAt)
    "hook": ("kitchen/ring", None), 0: ("kitchen/clock_pan", None), 1: ("kitchen/window_call", None),
    2: ("kitchen/cctv", 0), 3: ("kitchen/ots", 0.45), 4: ("kitchen/face", None), 5: ("kitchen/walk_phone", 0),
    6: ("kitchen/top_spin", 0.45), 7: ("kitchen/floor", None), 8: ("kitchen/outside", 0), 9: ("kitchen/warm_talk", 0.5),
    10: ("kitchen/ring_reach", 0.45), 11: ("kitchen/reveal", None),
}
for key, sc in [("hook", s["hook"]), *enumerate(s["scenes"])]:
    shot, ui_at = PLAN[key]
    for k in ("bg", "actors", "weather", "lights", "shots"):
        sc.pop(k, None)
    sc["world"] = {"shot": shot, "cast": CAST, "flicker": 1 if key == 1 else 0}
    if ui_at is not None:
        sc["uiAt"] = ui_at
    fx = sc.setdefault("fx", {})
    if "dark" in fx:
        fx["dark"] = min(fx["dark"], 0.1)
s["title"] = "Звонок: «Ваш сын попал в беду»"
s.pop("img_style", None)

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "pilot.json"
    json.dump([s], open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("ok", len(s["scenes"]), "сцен")
