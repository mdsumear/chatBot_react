import React, { useState, useEffect, useRef } from "react";

const SpeechToText = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [voices, setVoices] = useState([]);
  const [selectedRate, setSelectedRate] = useState(1);

  const speechRate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const [transcription, setTranscription] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const speakText = () => {
    if (!text) return;
    const textSpeech = new SpeechSynthesisUtterance();
    textSpeech.lang = "en-US";
    textSpeech.rate = selectedRate;
    textSpeech.voice = globalThis.speechSynthesis.getVoices()[selectedVoice];
    globalThis.speechSynthesis.speak(textSpeech);
  };
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = globalThis.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    globalThis.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      globalThis.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return (
    <div className="container">
      <h1>Text to Speech</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <select onChange={(e) => setSelectedRate(e.target.value)}>
        {speechRate.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select onChange={(e) => setSelectedVoice(e.target.value)}>
        {voices.map((voice, index) => (
          <option key={index} value={index}>
            {voice.name}
          </option>
        ))}
      </select>
      <button onClick={speakText}></button>
    </div>
  );
};
