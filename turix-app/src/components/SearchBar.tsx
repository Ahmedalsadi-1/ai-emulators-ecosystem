import React, { useState, useRef, useEffect } from 'react';
import { Mic, Search, X } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface SearchBarProps {
  onCommand: (command: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onCommand }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onCommand(query.trim());
      setQuery('');
      resetTranscript();
    }
  };

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleClear = () => {
    setQuery('');
    resetTranscript();
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <div className="turix-icon">
            <div className="cube-icon">◈</div>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What can I help you?"
            className="search-input"
            autoFocus
          />

          {query && (
            <button type="button" onClick={handleClear} className="clear-button">
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={handleMicClick}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            disabled={!browserSupportsSpeechRecognition}
          >
            <Mic size={18} />
          </button>
        </div>

        <button type="submit" className="search-button">
          <Search size={18} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;