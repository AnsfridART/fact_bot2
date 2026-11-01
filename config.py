import os

PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
POLLINATIONS_TOKEN = os.getenv("POLLINATIONS_TOKEN")  # необязательно
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID")            # необязательно, запасной генератор
CF_API_TOKEN = os.getenv("CF_API_TOKEN")

# ---- Голос рассказчика ----
TTS_ENGINE = os.getenv("TTS_ENGINE", "edge")    # silero / yandex / piper
VOICE = os.getenv("VOICE", "eugene")               # silero: aidar, eugene; yandex: filipp, ermil, madirus...
VOICE_SPEED = float(os.getenv("VOICE_SPEED", "1.0"))   # больше = медленнее речь
VOICE_PITCH = float(os.getenv("VOICE_PITCH", "1.0"))   # тон Silero: <0.85 очень низкий, <0.95 низкий
VOICE_POST_PITCH = float(os.getenv("VOICE_POST_PITCH", "1.0"))  # дополнительное понижение тона (0.9 = ниже)
VOICE_PRESET = os.getenv("VOICE_PRESET", "smooth")    # studio / deep / grandpa
VOICE_TEMPO = float(os.getenv("VOICE_TEMPO", "0.96"))  # общий темп речи (1.0 = как есть)
SENTENCE_PAUSE = 0.35                             # пауза между предложениями, сек
EDGE_VOICE = os.getenv("EDGE_VOICE", "ru-RU-DmitryNeural")   # или ru-RU-SvetlanaNeural
EDGE_RATE = os.getenv("EDGE_RATE", "+6%")                     # темп: "+0%" обычный
EDGE_PITCH = os.getenv("EDGE_PITCH", "-2Hz")                   # тон: "-5Hz" ниже, "+0Hz" как есть
SPEECHKIT_API_KEY = os.getenv("SPEECHKIT_API_KEY")
YANDEX_VOICE = os.getenv("YANDEX_VOICE", "madirus")        # filipp, ermil, zahar, madirus, alexander...
YANDEX_EMOTION = os.getenv("YANDEX_EMOTION", "none")     # good / neutral (у ermil), пусто — без эмоции
YANDEX_SPEED = os.getenv("YANDEX_SPEED", "1.05")
YC_FOLDER_ID = os.getenv("YC_FOLDER_ID")
FALLBACK_VOICE = "ru-RU-DmitryNeural"      # запасной голос edge-tts

FPS = 30
PUBLIC_DIR = "public"
QUEUE_DIR = "queue"
DONE_FILE = "done.txt"
MUSIC_DIR = "music"
OUTPUT = "output/video.mp4"
