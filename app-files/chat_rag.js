
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

        const blob = await response.blob();
        console.log("Response from backend:");
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        console.log("Playing audio from backend response:", audioUrl);
        await audio.play();

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






