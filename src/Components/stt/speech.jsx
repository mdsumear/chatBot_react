import React, { useState, useEffect } from "react";

const SpeechToText = () => {
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(0);

  const Rate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const speechText = () => {
    const speech = new SpeechSynthesisUtterance();
    speech.lang = "en-US";
    speech.rate = rate;
    speech.voice = globalThis.speechSynthesis.getVoices()[selectedVoice];
    globalThis.speechSynthesis.speak(speech);
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
    <div>
      <h1>Text to Speech</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <select
        onChange={(e) => {
          setRate(e.target.value);
        }}
      >
        {Rate.map((r) => (
          <option key={r} value={r}>
            r
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
      <button onClick={speechText}>Speak Text</button>
    </div>
  );
};

export default SpeechToText;
