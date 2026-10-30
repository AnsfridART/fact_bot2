import os

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

PIPER_MODEL = "models/voice.onnx"      # мужской голос, скачивается в workflow
PIPER_SPEED = 0.92                       # меньше = быстрее речь
FALLBACK_VOICE = "ru-RU-DmitryNeural"    # запасной голос edge-tts

FPS = 30
PUBLIC_DIR = "public"
QUEUE_DIR = "queue"
DONE_FILE = "done.txt"
MUSIC_DIR = "music"
OUTPUT = "output/video.mp4"
