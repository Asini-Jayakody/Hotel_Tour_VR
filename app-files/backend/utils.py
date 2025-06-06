import io
import wave


def l16_to_wav(l16_bytes, sample_rate=24000, sample_width=2, channels=1):
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(l16_bytes)
    wav_io.seek(0)
    return wav_io



