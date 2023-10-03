import React, { useState, useEffect } from 'react';
import './App.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();
function App() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [timer, setTimer] = useState(0);
  const [savedNotes, setSavedNotes] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedTextareaFontStyle, setSelectedTextareaFontStyle] = useState('Arial');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0); // Initial speech rate is 1.0 (normal speed)
  const [audioPlayer, setAudioPlayer] = useState(null);
  const handleSearch = () => {
    const regex = new RegExp(searchTerm, 'gi'); // 'gi' for global and case-insensitive search
    const highlightedNotes = savedNotes.map((note) =>
      note.replace(regex, (match) => `<span class="highlight">${match}</span>`)
    );
    setSavedNotes(highlightedNotes);
  };
  mic.continuous = true;
mic.interimResults = true;
let audioContext;
let audioBuffer;
let noiseThreshold = 0.5;

function handleFile() {
  const audioElement = document.getElementById('audioElement');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      decodeAudioData(arrayBuffer);
    };

    reader.readAsArrayBuffer(file);
  });

  fileInput.click();
}

function decodeAudioData(arrayBuffer) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioContext.decodeAudioData(arrayBuffer, (buffer) => {
    audioBuffer = buffer;
    const audioElement = document.getElementById('audioElement');
    audioElement.src = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/wav' }));
  }, (error) => {
    console.error('Error decoding audio data:', error);
  });
}

function applyNoiseReduction() {
  if (!audioBuffer) {
    alert('Please upload an audio file first.');
    return;
  }

  const audioData = audioBuffer.getChannelData(0);

  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) < noiseThreshold) {
      audioData[i] = 0; // Remove noise by setting low-amplitude frames to 0
    }
  }

  const newAudioBuffer = audioContext.createBuffer(1, audioData.length, audioBuffer.sampleRate);
  newAudioBuffer.copyToChannel(audioData, 0);

  const audioElement = document.getElementById('audioElement');
  audioElement.src = URL.createObjectURL(new Blob([newAudioBuffer], { type: 'audio/wav' }));
}


  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
    console.log('Color changed');
  };

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    document.body.classList.toggle('light-theme', !isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    handleListen();
    // eslint-disable-next-line
  }, [isListening, selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));
  }, [savedNotes]);

  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isListening]);
  const handleToggleMute = () => {
    if (audioPlayer) {
      audioPlayer.muted = !audioPlayer.muted; // Toggle mute state
    }
  };
  const handleSpeechRateChange = (rate) => {
    setSpeechRate(rate);
    mic.rate = rate; // Update the speech rate for the SpeechRecognition object
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setAudioUrl(URL.createObjectURL(file));

    // Create a new audio element
  const newAudioPlayer = new Audio(URL.createObjectURL(file));
  setAudioPlayer(newAudioPlayer);
  };


  const handlePlayAudio = () => {
    if (audioPlayer) {
      audioPlayer.play();
    }
  };

  const handlePauseAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause();
    }
  };

  const handleStopAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
  };
  

  const handleListen = () => {
    mic.lang = selectedLanguage;
    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setNote(transcript);
    };

    if (isListening) {
      mic.start();
      mic.onend = () => {
        console.log('Continue..');
        mic.start();
      };
    } else {
      mic.stop();
      mic.onend = () => {
        console.log('Stopped Mic on Click');
      };
    }
  };
 

  const handleListen1 = () => {
    mic.lang = selectedLanguage;
    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setNote(transcript);
    };
    if (isListening) {
      mic.start();
      mic.onend = () => {
        console.log('Continue..');
        mic.start();
      };
    } else {
      mic.stop();
      mic.onend = () => {
        console.log('Stopped Mic on Click');
      };
    }
  };
  const handleFocus = () => {
    const textarea = document.getElementById('glowing-textarea');
    if (textarea) {
      textarea.classList.add('glowing-border');
    }
  };
  
  const handleBlur = () => {
    const textarea = document.getElementById('glowing-textarea');
    if (textarea) {
      textarea.classList.remove('glowing-border');
    }
  };
  

  const handleSaveNote = () => {
    setSavedNotes([...savedNotes, note]);
    setNote('');
    setTimer(0); // Reset timer to 0 after saving a note
  };

  const handleClearNotes = () => {
    setSavedNotes([]);
  };

  const downloadNotes = () => {
    const blob = new Blob([savedNotes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  const handlePause = () => {
    if (mic && isListening) {
      mic.stop();
      console.log('Paused Mic on Click');
      setIsListening(false);
    }
  };
  const handleForwardAudio = (duration) => {
    if (audioPlayer) {
      audioPlayer.currentTime += duration;
    }
  };
  const handleBackwardAudio = (duration) => {
    if (audioPlayer) {
      audioPlayer.currentTime -= duration;
    }
  };

 
  const shareNotes = () => {
    const blob = new Blob([savedNotes.join('\n')], { type: 'text/plain' });
    const file = new File([blob], 'notes.txt', { type: 'text/plain' });
    const filesArray = [file];
    const shareData = {
      files: filesArray,
    };
    if (navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => console.log('Successfully shared'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      console.log('Sharing not supported');
    }
  };

  return (
    <>
      <button className="theme-toggle" onClick={toggleTheme}>
        <span className="theme-icon">{isDarkTheme ? '🌞' : '🌜'}</span> Toggle Theme
      </button>
      <div className="heading1">
        <h1>
          <span className="heading">Voice</span> <span className="heading2"> to </span>{' '}
          <span className="heading">Text</span>
        </h1>
        {/* <div className="container"> */}
      </div>
      <div className="box">
        <h2>Current Note</h2>
        {isListening ? <span>🎙️</span> : <span>🛑🎙️</span>}
        <button onClick={handleSaveNote} disabled={!note}>
          Save Note
        </button>
        <button onClick={() => setIsListening((prevState) => !prevState)}>
          Start/Stop
        </button>
        <div className='type'>
          <label htmlFor="languageDropdown">Select Language: </label>
          <select
            id="languageDropdown"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="ta-IN">Tamil</option>
            <option value="kan-IN">Kannada</option>
            <option value="ori-IN">Odia</option>
            <option value="mal-IN">Malayalam</option>
            <option value="spa-sp">Spanish</option>
            <option value="ger-ger">German</option>
            <option value="por-por">Portuguese</option>
            <option value="en-can">English (Canada)</option>
            <option value="tel-In">Telugu</option>
          </select>
        </div>
        <div className='type'>
          
          <label htmlFor="textareaFontStyleDropdown">Font Style: </label>
          <select
            id="textareaFontStyleDropdown"
            value={selectedTextareaFontStyle}
            onChange={(e) => setSelectedTextareaFontStyle(e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="noto sans devanagari">Hindi (Devanagari)</option>
            <option value="noto sans tamil">Tamil</option>
            <option value="noto sans telugu">Telugu</option>
            <option value="noto sans malayalam">Malayalam</option>
            <option value="arial">German</option>
            <option value="arial">Portuguese</option>
          </select>
        </div>
        <div className="audio-controls">
               <input type="file" accept="audio/*" onChange={handleFileUpload} />
          </div>
          <textarea
  id="glowing-textarea"
  placeholder="Type here..."
  value={note}
  onChange={(e) => setNote(e.target.value)}
  onFocus={() => handleFocus()}
  onBlur={() => handleBlur()}
  style={{ fontFamily: selectedTextareaFontStyle }}
  className="typing-animation neon-light-border"
></textarea>

          <div className="audio-controls">
        
        <button onClick={handlePlayAudio} disabled={!audioUrl}>
          Play
        </button>
        <button onClick={handlePauseAudio} disabled={!audioUrl}>
          Pause
        </button>
        <button onClick={handleStopAudio} disabled={!audioUrl}>
          Stop
        </button>
        <button onClick={handleToggleMute} disabled={!audioUrl}>
          {audioPlayer && audioPlayer.muted ? 'Unmute' : 'Mute'}
          </button>
          </div>
          <div className="speech-rate">
            <label htmlFor="speechRateDropdown">Select Speech Rate: </label>
            <select
            id="speechRateDropdown"
            value={speechRate}
            onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
            >
              <option value={0.5}>0.25x</option>
              <option value={0.75}>0.5x</option>
              <option value={1.0}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
              </select>
          </div>
          <div>
            <button onclick="applyNoiseReduction()">Apply Noise Reduction</button>
            </div>
         {/* ... (other JSX elements) */}
      <div className="audio-controls">
        {/* ... (other audio control buttons) */}
        <button onClick={() => handleForwardAudio(10)} disabled={!audioUrl}>
          Forward 10s
        </button>
        <button onClick={() => handleBackwardAudio(10)} disabled={!audioUrl}>
          Backward 10s
        </button>
      </div>
      {/* ... (other JSX elements) */}
         <p>Timer: {timer} seconds</p>
        <button onClick={handleClearNotes}>Clear Notes</button>
        <button onClick={downloadNotes}>Download </button>
        <button onClick={shareNotes}>Share Notes</button>
        
      </div>
      {}

      <div className="eachItem">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for a word"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="textView">
          <h2>Text View</h2>
          {savedNotes.map((note, index) => {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            const highlightedNote = note.replace(regex, (match, p1) => `<span class="highlight">${p1}</span>`);

            return <p key={index} dangerouslySetInnerHTML={{ __html: highlightedNote }} />;
          })}
        </div>
      </div>



    </>
  );
}

export default App;