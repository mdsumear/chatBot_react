import React, { useState, useEffect, useRef } from "react";
import "./TextToSpeech.css";

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedRate, setSelectedRate] = useState(1);

  const [transcription, setTranscription] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  const rate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
      }

      setInterimText(interimChunk);
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
    setInterimText("");
  };

  const clearTranscription = () => {
    setTranscription("");
    setInterimText("");
  };

  const speakText = () => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = selectedRate;
    speech.voice = window.speechSynthesis.getVoices()[selectedVoice];
    window.speechSynthesis.speak(speech);
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return (
    <div className="container-grid">
      <div className="container">
        <h1> Text to Speech</h1>

        <textarea
          className="text-area"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something for the computer to speak..."
        />

        <div className="controls">
          <label>Speed:</label>
          <select
            className="dropdown"
            onChange={(e) => setSelectedRate(e.target.value)}
          >
            {rate.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label>Voice:</label>
          <select
            className="dropdown"
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            {voices.map((voice, index) => (
              <option key={index} value={index}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn speak-btn" onClick={speakText}>
          Speak
        </button>
      </div>

      <div className="container">
        <h1> Speech to Text</h1>

        <div className="button-group">
          <button
            className="btn start-btn"
            onClick={startTranscription}
            disabled={isListening}
          >
            Start Listening
          </button>

          <button
            className="btn stop-btn"
            onClick={stopTranscription}
            disabled={!isListening}
          >
            Stop Listening
          </button>
        </div>

        {isListening && (
          <div className="waveform">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        )}

        <textarea
          className="text-area"
          value={transcription + interimText}
          readOnly
          placeholder="Your speech will appear here..."
        />
        <button className="btn clear-btn" onClick={clearTranscription}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default TextToSpeech;
