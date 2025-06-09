
export async function sendMessageToAvatar() {
    const inputBox = document.getElementById('userInput');
    const input = inputBox.value;
    if (!input) return;

    console.log("User said:", input);
    try {
        const response = await fetch("http://localhost:8000/avatar_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: input }),
        });

        const blob = await response.blob();
        console.log("Response from backend:");
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        console.log("Playing audio from backend response:", audioUrl);
        await audio.play();
    } catch (error) {
        console.error("Error sending message to avatar:", error);
    }
}


export async function talkToAvatar(inputBlob) {
    try {
        const response = await fetch("http://localhost:8000/avatar_speech", {
            method: "POST",
            headers: { "Content-Type": "audio/ogg" },
            body: inputBlob,
        });

        const data = await response.json();
        console.log("Response from backend for audio:", data.text_response);
        // showAvatarMessage(data.text_response);
        const fullText = data.text_response;

        const audioBinary = atob(data.audio_response);
        const byteArray = new Uint8Array(audioBinary.length);
        for (let i = 0; i < audioBinary.length; i++) {
            byteArray[i] = audioBinary.charCodeAt(i);
        }

        const audioBlob = new Blob([byteArray], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        // await audio.play();

        // Wait for audio metadata to get duration
        audio.onloadedmetadata = () => {
            const duration = audio.duration; // in seconds
            playAvatarTextAndAudio(fullText, audio, duration);
        };

        // const blob = await response.blob();
        // console.log("Response from backend:");
        // const audioUrl = URL.createObjectURL(blob);
        // const audio = new Audio(audioUrl);
        // console.log("Playing audio from backend response:", audioUrl);
        // await audio.play();

    } catch (error) {
        console.error("Error sending audio to avatar:", error);
    }

}


export async function sendAudioToAvatar(blob) {
    try {
        const response = await fetch("http://localhost:8000/speech-to-text", {
            method: "POST",
            headers: { "Content-Type": "audio/ogg" },
            body: blob,
        });

        console.log("Response from backend for audio:", response);
    } catch (error) {
        console.error("Error sending audio to avatar:", error);
    }
}



export function submitAudio(recordBtnId, stopBtnId){
    const record = document.getElementById(recordBtnId);
    const stopRec = document.getElementById(stopBtnId);

    console.log("check status: ", record, stopRec)

    if (navigator.mediaDevices) {
        console.log("getUserMedia supported.");

        let chunks = [];

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
            const mediaRecorder = new MediaRecorder(stream);

            record.onclick = () => {
                mediaRecorder.start();
                console.log(mediaRecorder.state);
                console.log("recorder started");
                record.style.background = "red";
                record.style.color = "black";
            };

            stopRec.onclick = () => {
                mediaRecorder.stop();
                console.log(mediaRecorder.state);
                console.log("recorder stopped");
                record.style.background = "";
                record.style.color = "";
            };

            mediaRecorder.onstop = (e) => {
                console.log("data available after MediaRecorder.stop() called.");
                const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
                console.log("recorder stopped, blob created", blob);
                chunks = [];
                // const audioURL = URL.createObjectURL(blob);
                console.log("sending blob to backend");
                talkToAvatar(blob)

                // // ⬇️ Download the audio file
                // const downloadLink = document.createElement("a");
                // downloadLink.href = audioURL;
                // downloadLink.download = "recorded_audio2.ogg";
                // document.body.appendChild(downloadLink);
                // downloadLink.click();
                // document.body.removeChild(downloadLink);
                // sendAudioToAvatar(blob);
            };

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };
            })
            .catch((err) => {
            console.error(`The following error occurred: ${err}`);
            });
        }
}



function playAvatarTextAndAudio(fullText, audio, duration) {
    const dialogueBox = document.getElementById("avatar-dialogue");
    const dialogueText = document.getElementById("avatar-dialogue-text");

    dialogueBox.style.display = "block";
    dialogueText.textContent = "";

    const totalChars = fullText.length;
    const interval = (duration * 1000) / totalChars; // ms per character

    let currentChar = 0;

    const typingInterval = setInterval(() => {
        if (currentChar < totalChars) {
            dialogueText.textContent += fullText[currentChar++];
        } else {
            clearInterval(typingInterval);
        }
    }, interval);

    audio.play();

    // // Hide message after audio ends
    // audio.onended = () => {
    //     dialogueBox.style.display = "none";
    // };

    setTimeout(() => {
        dialogueBox.style.display = "none";
    }, 10000);
}



// function showAvatarMessage(text) {
//     const dialogueBox = document.getElementById("avatar-dialogue");
//     const dialogueText = document.getElementById("avatar-dialogue-text");

//     dialogueText.textContent = text;
//     dialogueBox.style.display = "block";

//     // Auto-hide after 5 seconds
//     setTimeout(() => {
//         dialogueBox.style.display = "none";
//     }, 5000);
// }






