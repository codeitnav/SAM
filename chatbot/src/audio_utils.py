import speech_recognition as sr
import pyttsx3

# Initialize Text-to-Speech engine
engine = pyttsx3.init()


def set_voice(language_code="en-in"):
    voices = engine.getProperty("voices")
    for voice in voices:
        # The language code check can be adapted based on how voices are named on your OS
        if language_code.lower() in [lang.lower() for lang in voice.languages]:
            engine.setProperty("voice", voice.id)
            print(f"Found and set voice: {voice.name}")
            return

    # print(f"No voice found for language code '{language_code}'. Using default.")


set_voice("en-in")


def speak(text):
    """Converts text to speech."""
    engine.say(text)
    engine.runAndWait()


def listen():
    """Listens for voice input from the user and converts it to text."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("🎤 Listening...")
        r.pause_threshold = 1
        audio = r.listen(source)

    try:
        print("Recognizing...")
        query = r.recognize_google(audio, language="en-in")
        print(f"You said: {query}\n")
        return query
    except Exception as e:
        print("Could not understand your audio, please try again!")
        return ""
