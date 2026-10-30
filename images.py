"""Картинки для карточки: снимки NASA (запрос с префиксом nasa:) или фото Pixabay."""
import random
import requests
import config

UA = {"User-Agent": "factbot/2.0"}


def _download(url, path):
    r = requests.get(url, timeout=60, headers=UA)
    r.raise_for_status()
    if len(r.content) < 5000:
        raise RuntimeError("слишком маленький файл")
    with open(path, "wb") as f:
        f.write(r.content)
    return path


def _nasa(query, path):
    r = requests.get("https://images-api.nasa.gov/search",
                     params={"q": query, "media_type": "image"}, timeout=30, headers=UA)
    r.raise_for_status()
    items = r.json().get("collection", {}).get("items", [])[:15]
    random.shuffle(items)
    for it in items:
        links = it.get("links") or []
        if not links:
            continue
        thumb = links[0]["href"]
        for url in (thumb.replace("~thumb", "~large"), thumb.replace("~thumb", "~medium"), thumb):
            try:
                return _download(url, path)
            except Exception:
                continue
    raise RuntimeError(f"NASA: ничего по запросу {query}")


def _pixabay(query, path):
    for q in (query, " ".join(query.split()[:2]), query.split()[0]):
        r = requests.get("https://pixabay.com/api/", params={
            "key": config.PIXABAY_API_KEY, "q": q, "image_type": "photo",
            "orientation": "horizontal", "safesearch": "true", "per_page": 15, "order": "popular"},
            timeout=30, headers=UA)
        r.raise_for_status()
        hits = r.json().get("hits", [])[:8]
        if hits:
            hit = random.choice(hits[:4])
            return _download(hit.get("largeImageURL") or hit["webformatURL"], path)
    raise RuntimeError(f"Pixabay: ничего по запросу {query}")


def fetch(query: str, path: str):
    """Возвращает (путь, подпись источника)."""
    query = query.strip()
    if query.lower().startswith("nasa:"):
        q = query[5:].strip()
        try:
            return _nasa(q, path), "NASA"
        except Exception as e:
            print(e)
            query = q
    return _pixabay(query, path), "Pixabay"
