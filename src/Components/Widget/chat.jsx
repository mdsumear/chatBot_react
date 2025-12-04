import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import "./chat.css";
import aiAvatar from "../../assets/aiAvatar.png";
import userAvatar from "../../assets/userAvatar.png";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);

  const [interimText, setInterimText] = useState("");

  const [sessionId, setSessionId] = useState("");

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  const SpeechRecognition =
    globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSessionId(uuidv4());

    const loadVoices = () => {
      const voicesList = globalThis.speechSynthesis.getVoices();
      setVoices(voicesList);

      if (voicesList.length > 0) {
        setSelectedVoice(voicesList[0].name);
      }
    };

    loadVoices();
    globalThis.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  /* --------------------------
      SPEECH TO TEXT SETUP
  --------------------------- */
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

      setInputText((prev) => prev + finalChunk);
      setInterimText(interimChunk);
    };

    recognition.onerror = (err) => console.error(err);

    recognitionRef.current = recognition;
  }, []);

  const speak = (text) => {
    if (!text) return;

    // If already speaking → STOP
    if (isSpeaking) {
      globalThis.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Otherwise, START speaking
    globalThis.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    const voiceObj = voices.find((v) => v.name === selectedVoice);
    if (voiceObj) utter.voice = voiceObj;

    utter.onend = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    globalThis.speechSynthesis.speak(utter);
  };

  const startTranscription = () => {
    if (!recognitionRef.current) return;
    setInterimText("");
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopTranscription = () => {
    if (!recognitionRef.current) return;
    setIsListening(false);
    recognitionRef.current.stop();
    setInputText((prev) => prev + interimText);
    setInterimText("");
  };

  const clearTranscription = () => {
    setInputText("");
    setInterimText("");
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    globalThis.speechSynthesis.cancel();

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
      body: JSON.stringify({ message: inputText, sessionId }),
    });

    const data = await response.json();
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
    let objDiv = document.getElementById("chat-window");
    objDiv.scrollTop = objDiv.scrollHeight;
    speak(aiText);
  };

  const publishMessage = async (msg) => {
    if (!msg.trim()) return;
    globalThis.speechSynthesis.cancel();

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      sender: "user",
      text: msg,
      timestamp,
      avatar: userAvatar,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setIsAITyping(true);

    const response = await fetch("http://localhost:5000/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputText, sessionId }),
    });

    const data = await response.json();
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
    let objDiv = document.getElementById("chat-window");
    objDiv.scrollTop = objDiv.scrollHeight;
    speak(aiText);
  };

  useEffect(() => {
    if (isListening) {
      publishMessage(inputText);
    }
  }, [inputText]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>AI Assistant</h3>
      </div>

      <div id="chat-window" className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`msg-row ${msg.sender}`}>
            <img src={msg.avatar} className="avatar" alt="" />
            <div className={`msg-bubble ${msg.sender}`}>
              {msg.text}
              <div className="message-footer">
                <span className="timestamp">{msg.timestamp}</span>
                <button className="sound" onClick={() => speak(msg.text)}>
                  {isSpeaking ? "⏹" : "🔊"}
                </button>
              </div>
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
            {isListening ? "🎤 Listening..." : "🎤 Start"}
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
          <div className="speech-controls">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voices.map((v, i) => (
                <option key={i} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
