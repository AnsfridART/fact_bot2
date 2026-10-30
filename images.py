"""Картинки для сцен: генерация нейросетью в едином стиле (Pollinations, запасной Cloudflare),
если не получилось — стоковое фото Pixabay."""
import base64
import os
import random
import time
import urllib.parse
import requests
import config

UA = {"User-Agent": "factbot/3.0"}

STYLE = ("flat 2D vector cartoon illustration, muted desaturated colors, dark moody cinematic lighting, "
         "soft shadows, simple clean shapes, consistent minimalist style, vertical composition, "
         "no text, no letters, no watermark")


def _save(content, path):
    if len(content) < 8000:
        raise RuntimeError("слишком маленький файл")
    with open(path, "wb") as f:
        f.write(content)
    return path


def _pollinations(prompt, path, seed):
    url = "https://image.pollinations.ai/prompt/" + urllib.parse.quote(f"{prompt}. {STYLE}")
    params = {"width": 720, "height": 1280, "model": "flux", "nologo": "true", "seed": seed, "private": "true"}
    headers = dict(UA)
    if config.POLLINATIONS_TOKEN:
        headers["Authorization"] = f"Bearer {config.POLLINATIONS_TOKEN}"
    for attempt in range(4):
        r = requests.get(url, params=params, headers=headers, timeout=180)
        if r.status_code == 429:  # ограничение частоты: ждём и пробуем снова
            time.sleep(20)
            continue
        r.raise_for_status()
        if "image" not in r.headers.get("Content-Type", ""):
            raise RuntimeError("Pollinations вернул не картинку")
        return _save(r.content, path)
    raise RuntimeError("Pollinations: слишком много запросов")


def _cloudflare(prompt, path, seed):
    if not (config.CF_ACCOUNT_ID and config.CF_API_TOKEN):
        raise RuntimeError("Cloudflare не настроен")
    url = f"https://api.cloudflare.com/client/v4/accounts/{config.CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell"
    r = requests.post(url, headers={"Authorization": f"Bearer {config.CF_API_TOKEN}"},
                      json={"prompt": f"{prompt}. {STYLE}", "steps": 8, "seed": seed}, timeout=120)
    r.raise_for_status()
    return _save(base64.b64decode(r.json()["result"]["image"]), path)


def _pixabay(query, path):
    words = query.split()
    for q in (" ".join(words[:4]), " ".join(words[:2]), words[0]):
        r = requests.get("https://pixabay.com/api/", params={
            "key": config.PIXABAY_API_KEY, "q": q, "image_type": "illustration",
            "orientation": "vertical", "safesearch": "true", "per_page": 10}, timeout=30, headers=UA)
        r.raise_for_status()
        hits = r.json().get("hits", [])
        if hits:
            hit = random.choice(hits[:4])
            r = requests.get(hit.get("largeImageURL") or hit["webformatURL"], timeout=60, headers=UA)
            return _save(r.content, path)
    raise RuntimeError(f"Pixabay: ничего по запросу {query}")


def generate(prompt: str, path: str, seed: int, stock_query: str = "") -> str:
    for name, fn in (("Pollinations", _pollinations), ("Cloudflare", _cloudflare)):
        try:
            out = fn(prompt, path, seed)
            print(f"{name}: готово — {prompt[:60]}")
            return out
        except Exception as e:
            print(f"{name} не сработал: {e}")
    return _pixabay(stock_query or prompt, path)
