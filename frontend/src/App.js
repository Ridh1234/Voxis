import React, { useState, useEffect } from 'react';
import './index.css';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const App = () => {
  // State Management
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [text, setText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [callId, setCallId] = useState('');
  const [callStatus, setCallStatus] = useState(null);
  const [alert, setAlert] = useState(null);

  // Load voices on component mount
  useEffect(() => {
    fetchVoices();
  }, []);

  // Poll call status when we have a call ID
  useEffect(() => {
    if (callId && currentStep >= 3) {
      const interval = setInterval(() => {
        fetchCallStatus(callId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [callId, currentStep]);

  // API Functions
  const fetchVoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/voice/voices`);
      const data = await response.json();
      
      if (data.success) {
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      } else {
        showAlert('error', 'Failed to load voices: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      showAlert('error', 'Failed to connect to the server');
    }
  };

  const generateSpeech = async () => {
    try {
      setIsLoading(true);
      setCurrentStep(1);

      const response = await fetch(`${API_BASE_URL}/voice/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAudioUrl(data.audio_url);
        setCurrentStep(2);
        showAlert('success', 'Speech generated successfully!');
        return data.audio_url;
      } else {
        throw new Error(data.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      showAlert('error', 'Failed to generate speech: ' + error.message);
      setCurrentStep(0);
      throw error;
    }
  };

  const placeCall = async (audioUrl) => {
    try {
      setCurrentStep(3);

      const response = await fetch(`${API_BASE_URL}/call/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_number: phoneNumber,
          audio_url: `${window.location.origin}${audioUrl}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCallId(data.call_id);
        setCurrentStep(4);
        
        if (data.simulation) {
          showAlert('info', 'Call simulation started successfully! (Demo mode)');
        } else {
          showAlert('success', 'Call placed successfully!');
        }
      } else {
        throw new Error(data.error || 'Failed to place call');
      }
    } catch (error) {
      console.error('Error placing call:', error);
      showAlert('error', 'Failed to place call: ' + error.message);
      setCurrentStep(2);
      throw error;
    }
  };

  const fetchCallStatus = async (callId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/call/status/${callId}`);
      const data = await response.json();

      if (data.success) {
        setCallStatus(data.call_status);
      }
    } catch (error) {
      console.error('Error fetching call status:', error);
    }
  };

  // Complete Call Flow with Text-to-Speech and Call
  const completeCallFlow = async () => {
    try {
      setCurrentStep(1);
      setCallStatus('Generating AI voice...');

      const response = await fetch(`${API_BASE_URL}/call/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_id: selectedVoice,
          to_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(2);
        setCallStatus('Voice generated successfully!');
        setAudioUrl(data.audio_url);
        
        // Move to call placement step
        setCurrentStep(3);
        setCallStatus('Placing call...');
        
        // Set call ID and start monitoring
        if (data.call_id) {
          setCallId(data.call_id);
          setCurrentStep(4);
          setCallStatus('Call placed successfully!');
        }
        
        showAlert('success', 'Call placed successfully with your AI-generated message!');
      } else {
        throw new Error(data.error || 'Failed to complete call flow');
      }
    } catch (error) {
      console.error('Error in complete call flow:', error);
      showAlert('error', `Failed to complete call flow: ${error.message}`);
      throw error;
    }
  };

  // Complete Flow Function
  const handleCompleteFlow = async () => {
    if (!text.trim()) {
      showAlert('error', 'Please enter some text to convert to speech');
      return;
    }

    if (!selectedVoice) {
      showAlert('error', 'Please select a voice');
      return;
    }

    if (!phoneNumber.trim()) {
      showAlert('error', 'Please enter a phone number');
      return;
    }

    try {
      setIsLoading(true);
      await completeCallFlow();
    } catch (error) {
      console.error('Error in complete flow:', error);
      showAlert('error', 'Failed to complete the call flow');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper Functions
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setAudioUrl('');
    setCallId('');
    setCallStatus(null);
    setAlert(null);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as needed (this is a simple US format)
    if (digits.length <= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    return digits;
  };

  const steps = [
    'Enter Details',
    'Generating Speech',
    'Speech Ready',
    'Placing Call',
    'Call Active'
  ];

  return (
    <div className="container">
      {/* Premium Navigation */}
      <nav className="saas-navbar">
        <div className="saas-logo">
          🎤 Voxis
        </div>
        <ul className="saas-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#docs">Documentation</a></li>
          <li><a href="#support">Support</a></li>
        </ul>
      </nav>



      {/* Hero Header */}
      <div className="app-header">
        <div className="premium-badge">Enterprise Ready</div>
        <h1 className="app-title">🎤 Voxis</h1>
        <p className="app-subtitle">
          Advanced AI-powered voice synthesis with real-time telephony integration using ElevenLabs TTS & Twilio
        </p>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">22+</span>
            <span className="stat-label">AI Voices</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Support</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Main Card */}
        <div className="main-card-wrapper">
          <div className="main-card">
        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div key={index} className="progress-step">
              <div 
                className={`step-circle ${
                  index < currentStep ? 'completed' : 
                  index === currentStep ? 'active' : ''
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="step-label">{step}</span>
            </div>
          ))}
          <div 
            className="progress-line" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Alert Messages */}
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            <span>
              {alert.type === 'success' && '✅ '}
              {alert.type === 'error' && '❌ '}
              {alert.type === 'info' && 'ℹ️ '}
              {alert.type === 'warning' && '⚠️ '}
              {alert.message}
            </span>
          </div>
        )}

        {/* Text Input Section */}
        <div className="form-section">
          <h3 className="section-title">
            📝 Text to Convert
          </h3>
          <div className="form-group">
            <label className="form-label">Enter your message:</label>
            <textarea
              className="form-textarea"
              placeholder="Type the message you want to convert to speech and play during the call..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={5000}
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              {text.length}/5000 characters
            </small>
          </div>
        </div>

        {/* Voice Selection Section */}
        <div className="form-section">
          <h3 className="section-title">
            🎭 Voice Selection
          </h3>
          <div className="form-group">
            <label className="form-label">Choose a voice:</label>
            <select
              className="form-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voices && voices.length > 0 ? (
                voices.map((voice) => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category})
                    {voice.description ? ` - ${voice.description}` : ''}
                  </option>
                ))
              ) : (
                <option value="">Loading voices...</option>
              )}
            </select>
          </div>
        </div>

        {/* Phone Number Section */}
        <div className="form-section">
          <h3 className="section-title">
            📞 Call Details
          </h3>
          <div className="form-group">
            <label className="form-label">Phone Number:</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Enter phone number (e.g., +1234567890)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              Include country code (e.g., +91 for India, +1 for US)
            </small>
          </div>
        </div>

        {/* Audio Preview Section */}
        {audioUrl && (
          <div className="form-section">
            <h3 className="section-title">
              🎵 Generated Audio
            </h3>
            <audio 
              controls 
              className="audio-player"
              src={`${window.location.origin}${audioUrl}`}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Call Status Section */}
        {callStatus && (
          <div className="form-section">
            <h3 className="section-title">
              📊 Call Status
            </h3>
            <div className="status-card">
              {typeof callStatus === 'string' ? (
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className="status-value">{callStatus}</span>
                </div>
              ) : (
                <>
                  {callStatus.call_id && (
                    <div className="status-item">
                      <span className="status-label">Call ID:</span>
                      <span className="status-value">{callStatus.call_id}</span>
                    </div>
                  )}
                  {callStatus.status && (
                    <div className="status-item">
                      <span className="status-label">Status:</span>
                      <span className="status-value">
                        {callStatus.status.charAt(0).toUpperCase() + callStatus.status.slice(1)}
                      </span>
                    </div>
                  )}
                  {callStatus.duration && (
                    <div className="status-item">
                      <span className="status-label">Duration:</span>
                      <span className="status-value">{callStatus.duration}s</span>
                    </div>
                  )}
                  {callStatus.start_time && (
                    <div className="status-item">
                      <span className="status-label">Started:</span>
                      <span className="status-value">
                        {new Date(callStatus.start_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="form-section">
          {currentStep === 0 && (
            <button
              className="button button-primary button-large"
              onClick={handleCompleteFlow}
              disabled={isLoading || !text.trim() || !selectedVoice || !phoneNumber.trim()}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  🚀 Generate & Call Now
                </>
              )}
            </button>
          )}

          {currentStep >= 2 && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="button button-secondary"
                onClick={resetFlow}
                disabled={isLoading}
              >
                🔄 Start Over
              </button>
              
              {currentStep === 2 && (
                <button
                  className="button button-primary"
                  onClick={() => placeCall(audioUrl)}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner" />
                      Calling...
                    </>
                  ) : (
                    <>
                      📞 Place Call
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="saas-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🎤 Voxis</h4>
            <p>The most advanced AI voice synthesis platform for modern businesses.</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#integrations">Integrations</a></li>
              <li><a href="#api">API Documentation</a></li>
              <li><a href="#changelog">Changelog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press Kit</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li><a href="#blog">Blog</a></li>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#community">Community</a></li>
              <li><a href="#status">System Status</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            Powered by <strong>ElevenLabs</strong> AI Voice Synthesis & <strong>Twilio</strong> Cloud Communications
          </p>
          <p>
            © 2025 Voxis. Production-ready application with real API integrations and live calling capabilities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
