import React, { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

const Chatbot = () => {
  const userAvatar = "../../assets/userAvatar.png";
  const aiAvatar = "../../assets/aiAvatar.png";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // useEffect(() => {
  //   const fetchHistory = async () => {
  //     try {
  //       const res = await fetch("http://localhost:5000/history");
  //       const data = await res.json();
  //       setMessages(data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   fetchHistory();
  // }, []);

  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //   localStorage.setItem("chatHistory", JSON.stringify(messages));
  // }, [messages]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript + " ";
        else interimText += result[0].transcript + " ";
      }

      setInput(finalText + interimText);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(false);
    recognitionRef.current.stop();
  };

  const speakText = (text) => {
    if (!text) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const timestamp = getTime();
    const userMessage = { sender: "user", text: input, timestamp };
    setMessages((prev) => [...prev, userMessage]);

    await fetch("http://localhost:5000/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userMessage),
    });

    setInput("");
    setIsAITyping(true);

    try {
      const response = await fetch("http://localhost:5000/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.reply, avatar: aiAvatar, timestamp },
      ]);
      speakText(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAITyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <h3>AI Chatbot</h3>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            <img src={msg.avatar} alt="avatar" className="avatar" />
            <div className="text">{msg.text}</div>
            <span className="timestamp">{msg.timestamp}</span>
          </div>
        ))}
        {isAITyping && (
          <div className="message ai">
            <img src={aiAvatar} alt="avatar" className="avatar" />
            <div className="text typing">AI is typing...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={sendMessage}>Send</button>
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          className={isListening ? "listening" : ""}
        >
          🎤
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
