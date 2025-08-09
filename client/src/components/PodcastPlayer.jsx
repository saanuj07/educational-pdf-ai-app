import React, { useState, useEffect, useRef } from 'react';
import { generatePodcast } from '../services/api';

const PodcastPlayer = ({ documentId, onClose }) => {
  const [podcastData, setPodcastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [error, setError] = useState('');

  const audioRef = useRef(null);
  const transcriptRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    generatePodcastData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [documentId]);

  useEffect(() => {
    if (autoScroll && currentWordIndex >= 0 && transcriptRef.current) {
      const wordElement = transcriptRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`);
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentWordIndex, autoScroll]);

  const generatePodcastData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await generatePodcast(documentId);
      
      console.log('📊 Podcast API Response:', response);
      
      if (response.success) {
        console.log('✅ Success path - podcast data:', response.podcast);
        // Convert relative URL to absolute URL
        const podcastData = { ...response.podcast };
        if (podcastData.audioUrl && podcastData.audioUrl.startsWith('/api/')) {
          podcastData.audioUrl = `http://localhost:5000${podcastData.audioUrl}`;
          console.log('🔗 Converted audio URL to:', podcastData.audioUrl);
        }
        setPodcastData(podcastData);
      } else if (response.fallback) {
        console.log('⚠️ Fallback path - podcast data:', response.fallback);
        // Convert relative URL to absolute URL for fallback too
        const fallbackData = { ...response.fallback };
        if (fallbackData.audioUrl && fallbackData.audioUrl.startsWith('/api/')) {
          fallbackData.audioUrl = `http://localhost:5000${fallbackData.audioUrl}`;
          console.log('🔗 Converted fallback audio URL to:', fallbackData.audioUrl);
        }
        setPodcastData(fallbackData);
        setError('Using demo data - TTS service not configured');
      } else {
        console.log('❌ No valid data found in response');
        setError('Failed to generate podcast');
      }
    } catch (err) {
      console.log('🚨 Error generating podcast:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    console.log('🎵 Play button clicked');
    console.log('Audio ref:', audioRef.current);
    console.log('Podcast data:', podcastData);
    console.log('Audio src:', audioRef.current?.src);
    console.log('Audio readyState:', audioRef.current?.readyState);
    
    if (audioRef.current && podcastData) {
      if (playing) {
        console.log('⏸️ Pausing audio');
        audioRef.current.pause();
      } else {
        console.log('▶️ Playing audio');
        audioRef.current.play().catch(error => {
          console.error('❌ Audio play error:', error);
          setError(`Audio playback failed: ${error.message}`);
        });
      }
      setPlaying(!playing);
    } else {
      console.log('❌ Cannot play - missing audio ref or podcast data');
      if (!audioRef.current) console.log('Missing audio ref');
      if (!podcastData) console.log('Missing podcast data');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      
      // Find current word based on timestamp
      if (podcastData?.syncData) {
        const currentWord = podcastData.syncData.find(word => 
          current >= word.start && current <= word.end
        );
        if (currentWord) {
          const wordIndex = podcastData.syncData.indexOf(currentWord);
          setCurrentWordIndex(wordIndex);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (podcastData?.audioUrl) {
      const link = document.createElement('a');
      link.href = podcastData.audioUrl;
      link.download = `podcast_${documentId}.mp3`;
      link.click();
    }
  };

  const renderTranscript = () => {
    if (!podcastData?.transcript || !podcastData?.syncData) {
      return <p className="text-gray-500">No transcript available</p>;
    }

    const words = podcastData.transcript.split(/\s+/);
    
    return (
      <div className="transcript-content">
        {words.map((word, index) => {
          const syncWord = podcastData.syncData.find(sw => sw.originalText === word);
          const isCurrentWord = syncWord && podcastData.syncData.indexOf(syncWord) === currentWordIndex;
          
          return (
            <span
              key={index}
              data-word-index={syncWord ? podcastData.syncData.indexOf(syncWord) : -1}
              className={`transcript-word ${isCurrentWord ? 'current-word' : ''}`}
              onClick={() => {
                if (syncWord && audioRef.current) {
                  audioRef.current.currentTime = syncWord.start;
                }
              }}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="podcast-player loading">
        <div className="loading-spinner"></div>
        <p>Generating podcast...</p>
      </div>
    );
  }

  if (error && !podcastData) {
    return (
      <div className="podcast-player error">
        <p className="error-message">{error}</p>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    );
  }

  return (
    <div className="podcast-player">
      <div className="podcast-header">
        <h3 className="podcast-title">{podcastData?.title || 'PDF Podcast'}</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {error && (
        <div className="warning-message">
          <p>{error}</p>
        </div>
      )}

      {/* Audio Element */}
      {podcastData?.audioUrl && (
        <audio
          ref={audioRef}
          src={podcastData.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadStart={() => console.log('🔄 Audio load started')}
          onCanPlay={() => console.log('✅ Audio can play')}
          onError={(e) => {
            const error = e.target.error;
            console.error('❌ Audio error details:', {
              code: error?.code,
              message: error?.message,
              src: e.target.src,
              readyState: e.target.readyState,
              networkState: e.target.networkState
            });
            setError(`Audio playback error: ${getMediaErrorMessage(error?.code)}`);
          }}
        />
      )}

      {/* Player Controls */}
      <div className="player-controls">
        <div className="main-controls">
          <button 
            className="skip-btn" 
            onClick={() => handleSkip(-10)}
            title="Skip back 10 seconds"
          >
            ⏪
          </button>
        
          <button 
            className={`play-btn ${playing ? 'playing' : ''}`}
            onClick={handlePlay}
            disabled={!podcastData?.audioUrl}
          >
            {playing ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className="skip-btn" 
            onClick={() => handleSkip(10)}
            title="Skip forward 10 seconds"
          >
            ⏩
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleSeek}>
            <div 
              className="progress-fill" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        {/* Secondary Controls */}
        <div className="secondary-controls">
          <div className="volume-control">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>

          <div className="speed-control">
            <span>Speed:</span>
            {[0.5, 1, 1.5, 2].map(s => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => handleSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          <button className="download-btn" onClick={downloadAudio} title="Download audio">
            ⬇️
          </button>
        </div>
      </div>

      {/* Podcast Info */}
      <div className="podcast-info">
        <p>Duration: {formatTime(podcastData?.duration || 0)}</p>
        <p>Voice: {podcastData?.voice || 'Default'}</p>
        {podcastData?.pages && <p>Pages: {podcastData.pages}</p>}
      </div>

      {/* Transcript Controls */}
      <div className="transcript-controls">
        <button
          className={`transcript-toggle ${showTranscript ? 'active' : ''}`}
          onClick={() => setShowTranscript(!showTranscript)}
        >
          {showTranscript ? 'Hide' : 'Show'} Transcript
        </button>
        
        {showTranscript && (
          <button
            className={`auto-scroll-toggle ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            Auto Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        )}
      </div>

      {/* Transcript */}
      {showTranscript && (
        <div className="transcript-container" ref={transcriptRef}>
          <h4>Transcript</h4>
          {renderTranscript()}
        </div>
      )}
    </div>
  );
};

export default PodcastPlayer;
