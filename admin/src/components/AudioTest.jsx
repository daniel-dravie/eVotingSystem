import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';

const AudioTest = () => {
  const [audioStatus, setAudioStatus] = useState('');

  const testAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Testing audio functionality. Vote confirmed! Total votes now: 5');
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setAudioStatus('Audio started...');
      utterance.onend = () => setAudioStatus('Audio completed!');
      utterance.onerror = (e) => setAudioStatus(`Audio error: ${e.error}`);
      
      speechSynthesis.speak(utterance);
    } else {
      setAudioStatus('Speech synthesis not supported in this browser');
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Typography variant="h6">Audio Test Component</Typography>
      <Button variant="contained" onClick={testAudio} style={{ margin: '10px' }}>
        Test Audio
      </Button>
      <Typography>{audioStatus}</Typography>
      <Typography variant="body2" color="textSecondary">
        Note: Make sure your browser has audio permissions enabled and volume is turned up
      </Typography>
    </div>
  );
};

export default AudioTest;
