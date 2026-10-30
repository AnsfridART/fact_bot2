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

## Формат сценария
```json
{
  "title": "Заголовок",
  "hook": {"text": "Фраза-крючок", "image": "octopus underwater"},
  "facts": [
    {"text": "Текст для озвучки", "image": "nasa:moon", "big": "400 ЛЕТ",
     "emotion": "shock", "source": "Источник"}
  ],
  "description": "Описание для YouTube",
  "hashtags": ["факты"]
}
```
- `image`: запрос для поиска на английском. С префиксом `nasa:` картинка берётся из архива NASA.
- `big`: красная плашка с цифрой, при её появлении камера наезжает на профессора.
- `emotion`: point (указывает), shock (удивляется), think (задумался), laugh (смеётся).

## Расписание
`cron` в `video.yml`, время в UTC (Москва = UTC+3).

## Музыка (необязательно)
Папка `music/` с mp3 без авторских прав.
