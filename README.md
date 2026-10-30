# FactBot 2.0: профессор-рассказчик

Каждый запуск GitHub Actions берёт следующий сценарий из `queue/`, озвучивает его мужским голосом (Piper),
подбирает картинки (NASA / Pixabay), анимирует профессора в Remotion и присылает готовый ролик в Telegram.

## Файлы
- `src/Scene.jsx`: вся анимация (профессор, карточки, субтитры, плашки)
- `run.py`: сценарий → озвучка → картинки → рендер → Telegram
- `queue/*.json`: очередь сценариев
- `.github/workflows/video.yml`: расписание и установка

## Секреты (Settings → Secrets and variables → Actions)
`PIXABAY_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

## Формат сценария (история)
```json
{
  "title": "Заголовок",
  "intro": {"title": "СТРОКА 1|*КЛЮЧЕВОЕ*", "text": "Что говорит профессор в начале"},
  "scenes": [
    {"text": "Фраза рассказчика, *слово* = красное", "prompt": "english scene description",
     "tag": "1932 · АВСТРАЛИЯ", "alert": "КРАСНАЯ ПЛАШКА", "cam": "in"}
  ],
  "punch": {"big": "ФИНАЛЬНАЯ|*ФРАЗА*", "text": "Что звучит на чёрном экране"},
  "outro": {"text": "Что говорит профессор в конце"},
  "source": "Источник", "description": "Описание", "hashtags": ["факты"]
}
```
`cam`: in, out, left, right, up, shake. Картинки сцен рисует нейросеть (Pollinations, запасной Cloudflare Workers AI через секреты `CF_ACCOUNT_ID` и `CF_API_TOKEN`).

## Голос
Переменные репозитория (Settings → Secrets and variables → Actions → Variables): `VOICE` (dmitri/denis/ruslan), `VOICE_SPEED`, `VOICE_PITCH`. Тест голосов: Run workflow → mode = voices.

## Расписание
`cron` в `video.yml`, время в UTC (Москва = UTC+3).
