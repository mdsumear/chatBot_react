import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

import aiAvatar from "../../assets/aiAvatar.png";
import userAvatar from "../../assets/userAvatar.png";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);

  const [transcription, setTranscription] = useState("");
  const [interimText, setInterimText] = useState("");

  // const mediaRecorderRef = useRef(null);
  // const audioChunks = useRef([]);

  // const [voices, setVoices] = useState([]);
  // const [speed, setSpeed] = useState(1);
  // const [selectedVoice, setSelectedVoice] = useState(0);

  const Speed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // useEffect(() => {
  //   const loadVoices = () => {
  //     const v = window.speechSynthesis.getVoices();
  //     setVoices(v);
  //   };
  //   loadVoices();
  //   window.speechSynthesis.onvoiceschanged = loadVoices;
  // }, []);
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    // utter.voice = voices[selectedVoice];
    utter.lang = "en-US";
    // utter.rate = speed;
    window.speechSynthesis.speak(utter);
  };

  // Load chat history
  useEffect(() => {
    fetch("http://localhost:5000/history")
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, []);

  // Save history to backend automatically
  useEffect(() => {
    fetch("http://localhost:5000/save-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: messages }),
    });
  }, [messages]);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          finalChunk += result[0].transcript + " ";
        } else {
          interimChunk += result[0].transcript + " ";
        }
      }

      if (finalChunk) {
        setTranscription((prev) => prev + finalChunk);
        setInputText((prev) => prev + finalChunk);
      }

      setInterimText(interimChunk);
      setInputText(interimChunk);
      console.log("Interim Text:", interimChunk); // Add this log
    };

    recognition.onerror = (err) => console.error(err);

    recognitionRef.current = recognition;
  }, []);

  const startTranscription = () => {
    if (!recognitionRef.current) return;
    setTranscription("");
    setInterimText("");
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopTranscription = () => {
    if (!recognitionRef.current) return;

    setIsListening(false);
    recognitionRef.current.stop();

    setTranscription((prev) => prev + interimText);
    setInputText((prev) => prev + interimText);
    setInterimText("");
  };

  const clearTranscription = () => {
    setTranscription("");
    setInterimText("");
  };

  // Send user message
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      sender: "user",
      text: inputText,
      timestamp,
      avatar: userAvatar,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setIsAITyping(true);

    const response = await fetch("http://localhost:5000/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputText }),
    });

    const data = await response.json();
    console.log("AI Response:", data); // Add this log to debug the AI response

    const aiText = data.reply;

    const aiMsg = {
      sender: "ai",
      text: aiText,
      timestamp,
      avatar: aiAvatar,
    };
    clearTranscription();

    setIsAITyping(false);
    setMessages((prev) => [...prev, aiMsg]);

    speak(aiText);
  };

  // Whisper STT (Start)
  // const startListening = async () => {
  //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //   mediaRecorderRef.current = new MediaRecorder(stream);
  //   audioChunks.current = [];

  //   mediaRecorderRef.current.ondataavailable = (e) => {
  //     audioChunks.current.push(e.data);
  //   };

  //   mediaRecorderRef.current.onstop = async () => {
  //     const blob = new Blob(audioChunks.current, { type: "audio/wav" });

  //     const formData = new FormData();
  //     formData.append("audio", blob, "speech.wav");

  //     const res = await fetch("http://localhost:5000/whisper", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     const data = await res.json();
  //     setInputText((prev) => prev + " " + data.text);
  //   };

  //   mediaRecorderRef.current.start();
  //   setIsListening(true);
  // };

  // Whisper Stop
  // const stopListening = () => {
  //   setIsListening(false);
  //   mediaRecorderRef.current.stop();
  // };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>AI Assistant</h3>
      </div>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.sender}`}>
            <img src={msg.avatar} className="avatar" alt="" />
            <div className={`msg-bubble ${msg.sender}`}>
              {msg.text}
              <div className="timestamp">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isAITyping && (
          <div className="msg-row ai">
            <img src={aiAvatar} className="avatar" />
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <textarea
          className="chat-input"
          placeholder="Type or speak..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <div className="button-row">
          <button className="btn mic-btn" onClick={startTranscription}>
            {isListening ? "🎤 Listening..." : "🎤 Hold to speak"}
          </button>

          <button
            className="btn stop-btn"
            onClick={stopTranscription}
            disabled={!isListening}
          >
            Stop
          </button>

          <button className="btn send-btn" onClick={sendMessage}>
            ➤
          </button>
        </div>

        {/* <select
          className="voice-select"
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          {voices.map((v, i) => (
            <option key={i} value={i}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          className="speed-select"
          onChange={(e) => setSpeed(e.target.value)}
        >
          {Speed.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select> */}
      </div>
    </div>
  );
};

export default Chatbot;
