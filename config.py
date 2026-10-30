import os

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
POLLINATIONS_TOKEN = os.getenv("POLLINATIONS_TOKEN")  # необязательно
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")            # необязательно, запасной генератор
CF_API_TOKEN = os.getenv("CF_API_TOKEN")

# ---- Голос рассказчика ----
VOICE = os.getenv("VOICE", "dmitri")       # dmitri / denis / ruslan (мужские голоса Piper)
VOICE_SPEED = float(os.getenv("VOICE_SPEED", "1.22"))  # больше = медленнее речь
VOICE_PITCH = float(os.getenv("VOICE_PITCH", "0.90"))  # меньше = ниже и «старше» голос
SENTENCE_PAUSE = 0.35                      # пауза между предложениями, сек
FALLBACK_VOICE = "ru-RU-DmitryNeural"      # запасной голос edge-tts

FPS = 30
PUBLIC_DIR = "public"
QUEUE_DIR = "queue"
DONE_FILE = "done.txt"
MUSIC_DIR = "music"
OUTPUT = "output/video.mp4"
