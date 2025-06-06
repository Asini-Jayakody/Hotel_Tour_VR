
export async function sendMessageToAvatar() {
    const inputBox = document.getElementById('userInput');
    const input = inputBox.value;
    if (!input) return;

    console.log("User said:", input);
    try {
        const response = await fetch("http://localhost:8000/avatar", {
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
