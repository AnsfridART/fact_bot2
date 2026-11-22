"""Record the owner's confirmed result for the south bank after chapter one."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("winner", choices=["farm", "barracks"])
args = parser.parse_args()
path = Path(__file__).with_name("city.json")
city = json.loads(path.read_text())
parcel = {"afterEpisode": 1, "x": 3, "z": 5.3, "type": args.winner}
existing = next((b for b in city["buildings"] if (b["x"], b["z"]) == (3, 5.3)), None)
if existing is None:
    city["buildings"].append(parcel)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(city, indent=2) + "\n")
    temporary.replace(path)
elif existing != parcel:
    parser.error("Для этого участка уже записан другой выбор.")
