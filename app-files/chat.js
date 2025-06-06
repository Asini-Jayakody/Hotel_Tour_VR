// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_API_KEY = "AIzaSyCCVl-8WiHWwX6IoQL9zSJZFcn7oMLtFVQ"
if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in your environment variables.");
}
const TTS_model = "gemini-2.5-flash-preview-tts"
const STT_model = "gemini-2.5-flash-preview-05-20"
const GEMINI_TTS_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_model}:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_STT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${STT_model}:generateContent?key=${GEMINI_API_KEY}`;


export async function sendMessageToAvatar() {
    const inputBox = document.getElementById('userInput');
    const input = inputBox.value;
    if (!input) return;

    console.log("User said:", input);
    try {
        const base64AudioInput = await generateAvatarResponse(input); 
        // const base64AudioInput = 'yes' 
        if (base64AudioInput) {
            const textReply = await generateAvatarResponseText(base64AudioInput);
            const base64Audio = await generateAvatarResponse(textReply)
            const wavBlob = base64PCMToWavBlob(base64Audio);
            const audioUrl = URL.createObjectURL(wavBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
        }else {
            console.log("No audio received for the avatar.");
        }
    } catch (error) {
        console.error("Error sending message to avatar:", error);
    }
}


export async function generateAvatarResponseText(audioMessage) {
    const audioInput = await wrapPCMBase64AsWavBase64(audioMessage);
   
    try {
        const body = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            'text': "You are a Hotel tour assistance. Generate the response based on the question asked from the audio input."
                        },
                        {
                            inline_data: {
                                mime_type: "audio/wav",
                                data: audioInput
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ["TEXT"]
            }
        }

        const response = await fetch(GEMINI_STT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            });


        const data = await response.json();
        console.log("Response from Gemini:", data);
        const textResponse = data.candidates[0].content.parts[0].text;
        console.log("Text response:", textResponse);
        return textResponse
        
    } catch (error) {
        console.log('Error happen when generating text response: ', error)
    }
    
}

export async function generateAvatarResponse(text) {
  try {
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"
            }
          }
        }
      }
    };

    const response = await fetch(GEMINI_TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });


    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        const base64Audio = data.candidates[0].content.parts[0].inlineData.data;
        return base64Audio; // Return the base64 audio data if needed
    } else {
      console.log("No audio received:", data);
    }

  } catch (error) {
    console.error("Error calling Gemini:", error);
  }
}


export function base64PCMToWavBlob(base64PCM, sampleRate = 24000, numChannels = 1, bytesPerSample = 2) {
  const pcmBinary = atob(base64PCM);
  const pcmBuffer = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) {
    pcmBuffer[i] = pcmBinary.charCodeAt(i);
  }

  const wavBuffer = createWavBuffer(pcmBuffer, sampleRate, numChannels, bytesPerSample);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}


function createWavBuffer(pcmData, sampleRate, numChannels, bytesPerSample) {
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavSize = 44 + pcmData.length;

  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);

  // Write PCM data
  const pcmOffset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setUint8(pcmOffset + i, pcmData[i]);
  }

  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}



export function wrapPCMBase64AsWavBase64(base64PCM, sampleRate = 24000, numChannels = 1, bytesPerSample = 2) {
    const pcmBinary = atob(base64PCM);
    const pcmBuffer = new Uint8Array(pcmBinary.length);
    for (let i = 0; i < pcmBinary.length; i++) {
        pcmBuffer[i] = pcmBinary.charCodeAt(i);
    }

    const wavBuffer = createWavBuffer(pcmBuffer, sampleRate, numChannels, bytesPerSample);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Wav = reader.result.split(',')[1];
            resolve(base64Wav);
        };
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
    });
}

// function createWavBuffer(pcmData, sampleRate, numChannels, bytesPerSample) {
//     const blockAlign = numChannels * bytesPerSample;
//     const byteRate = sampleRate * blockAlign;
//     const wavSize = 44 + pcmData.length;

//     const buffer = new ArrayBuffer(wavSize);
//     const view = new DataView(buffer);

//     // RIFF chunk descriptor
//     writeString(view, 0, 'RIFF');
//     view.setUint32(4, 36 + pcmData.length, true);
//     writeString(view, 8, 'WAVE');

//     // fmt subchunk
//     writeString(view, 12, 'fmt ');
//     view.setUint32(16, 16, true); // PCM
//     view.setUint16(20, 1, true); // PCM format
//     view.setUint16(22, numChannels, true);
//     view.setUint32(24, sampleRate, true);
//     view.setUint32(28, byteRate, true);
//     view.setUint16(32, blockAlign, true);
//     view.setUint16(34, bytesPerSample * 8, true);

//     // data subchunk
//     writeString(view, 36, 'data');
//     view.setUint32(40, pcmData.length, true);

//     for (let i = 0; i < pcmData.length; i++) {
//         view.setUint8(44 + i, pcmData[i]);
//     }

//     return buffer;
// }

// function writeString(view, offset, str) {
//     for (let i = 0; i < str.length; i++) {
//         view.setUint8(offset + i, str.charCodeAt(i));
//     }
// }










