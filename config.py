import os

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
POLLINATIONS_TOKEN = os.getenv("POLLINATIONS_TOKEN")  # необязательно
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")            # необязательно, запасной генератор
CF_API_TOKEN = os.getenv("CF_API_TOKEN")

# ---- Голос рассказчика ----
TTS_ENGINE = os.getenv("TTS_ENGINE", "silero")    # silero / yandex / piper
VOICE = os.getenv("VOICE", "aidar")               # silero: aidar, eugene; yandex: filipp, ermil, madirus...
VOICE_SPEED = float(os.getenv("VOICE_SPEED", "1.2"))   # больше = медленнее речь
VOICE_PITCH = float(os.getenv("VOICE_PITCH", "1.0"))   # тон Silero: <0.85 очень низкий, <0.95 низкий
VOICE_POST_PITCH = float(os.getenv("VOICE_POST_PITCH", "1.03"))  # дополнительное понижение тона (0.9 = ниже)
VOICE_PRESET = os.getenv("VOICE_PRESET", "grandpa")    # studio / deep / grandpa
SENTENCE_PAUSE = 0.35                             # пауза между предложениями, сек
SPEECHKIT_API_KEY = os.getenv("SPEECHKIT_API_KEY")
YC_FOLDER_ID = os.getenv("YC_FOLDER_ID")
FALLBACK_VOICE = "ru-RU-DmitryNeural"      # запасной голос edge-tts

FPS = 30
PUBLIC_DIR = "public"
QUEUE_DIR = "queue"
DONE_FILE = "done.txt"
MUSIC_DIR = "music"
OUTPUT = "output/video.mp4"
