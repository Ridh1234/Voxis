# 🎤 Voice Over AI Agent

A comprehensive web application that allows users to generate AI-powered voices using ElevenLabs TTS API and place calls using Exotel telephony integration. This project demonstrates the integration of AI-generated voices with real-time telephony systems.

## 🎯 Project Overview

The Voice Over AI Agent enables users to:
- Input custom text for voice generation
- Select from multiple AI voices provided by ElevenLabs
- Generate high-quality speech audio from text
- Place phone calls using the generated audio via Exotel API
- Monitor call status and progress in real-time
- Experience seamless integration between TTS and telephony services

## ✨ Features

### Frontend Features
- **Modern React Interface**: Clean, responsive UI built with React
- **Real-time Progress Tracking**: Visual progress indicators for each step
- **Voice Selection**: Dropdown menu with available ElevenLabs voices
- **Audio Preview**: Play generated audio before placing the call
- **Call Status Monitoring**: Real-time call status updates
- **Error Handling**: Comprehensive error messages and user feedback
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

### Backend Features
- **ElevenLabs TTS Integration**: Full API integration for voice generation
- **Exotel Telephony**: Complete call placement and management
- **Audio File Management**: Automatic audio file storage and cleanup
- **API Rate Limiting**: Built-in protection against abuse
- **Simulation Mode**: Demo functionality when APIs aren't configured
- **Comprehensive Logging**: Detailed logs for debugging and monitoring
- **Error Recovery**: Graceful fallback mechanisms

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **CSS3**: Custom styling with modern design principles
- **Axios**: HTTP client for API communication
- **Font Awesome**: Icon library for enhanced UX

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Axios**: HTTP client for external API calls
- **fs-extra**: Enhanced file system operations
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware
- **Morgan**: HTTP request logging

### APIs & Services
- **ElevenLabs TTS API**: AI voice generation
- **Exotel API**: Cloud telephony platform
- **MP3 Audio Format**: Standard audio format for voice files

## 📁 Project Structure

```
voice-over-ai-agent/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── services/          # External API integrations
│   │   │   ├── elevenLabs.ts  # ElevenLabs TTS service
│   │   │   └── exotel.ts      # Exotel telephony service
│   │   ├── routes/            # API route handlers
│   │   │   ├── voice.ts       # Voice generation endpoints
│   │   │   └── call.ts        # Call management endpoints
│   │   └── server.ts          # Main server application
│   ├── audio/                 # Generated audio files storage
│   ├── dist/                  # Compiled JavaScript (auto-generated)
│   ├── package.json          # Backend dependencies
│   ├── tsconfig.json         # TypeScript configuration
│   ├── .env                  # Environment variables
│   └── .env.example          # Environment template
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Styles and UI components
│   ├── public/               # Static files
│   └── package.json          # Frontend dependencies
└── README.md                 # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- ElevenLabs account (for voice generation)
- Exotel account (for telephony features)

### Step 1: Clone or Download the Project
```bash
# If using Git (not required for this assignment)
# git clone <repository-url>
# cd voice-over-ai-agent

# Or simply extract the provided project files
cd voice-over-ai-agent
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env file with your API credentials (see configuration section below)
# Build the TypeScript code
npm run build
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install --legacy-peer-deps
```

### Step 4: Configuration

Edit the `backend/.env` file with your API credentials:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Exotel Configuration (optional for demo)
EXOTEL_API_KEY=your_exotel_api_key_here
EXOTEL_API_TOKEN=your_exotel_api_token_here
EXOTEL_SID=your_exotel_sid_here
EXOTEL_VIRTUAL_NUMBER=your_virtual_number_here
```

**Note**: If you don't have API keys, the application will work in simulation mode with mock data.

### Step 5: Running the Application

#### Start the Backend Server
```bash
# From backend directory
npm run dev
# Or for production
npm start
```
The backend will start on http://localhost:3001

#### Start the Frontend Application
```bash
# From frontend directory (in a new terminal)
npm start
```
The frontend will start on http://localhost:3000

## 🔧 API Configuration

### ElevenLabs Setup
1. Create a free account at https://elevenlabs.io/
2. Navigate to your profile settings
3. Copy your API key
4. Add it to your `.env` file as `ELEVENLABS_API_KEY`

### Exotel Setup (Optional)
1. Sign up for an Exotel account at https://exotel.com/
2. Get your API credentials from the dashboard
3. Configure a virtual number for outbound calls
4. Add credentials to your `.env` file

**Important**: Without Exotel credentials, the app will use simulation mode which demonstrates all functionality without making real calls.

## 📖 Usage Guide

### Basic Workflow
1. **Open the Application**: Navigate to http://localhost:3000
2. **Enter Text**: Type the message you want to convert to speech
3. **Select Voice**: Choose from available ElevenLabs voices
4. **Enter Phone Number**: Provide the destination phone number
5. **Generate & Call**: Click the button to start the process
6. **Monitor Progress**: Watch the progress indicators
7. **Review Results**: Check call status and listen to generated audio

### Advanced Features
- **Audio Preview**: Listen to generated audio before placing the call
- **Call Status**: Real-time monitoring of call progress
- **Error Recovery**: Automatic fallback to simulation mode
- **File Cleanup**: Automatic cleanup of old audio files

## 🔍 API Endpoints

### Voice Endpoints
- `GET /api/voice/voices` - Get available voices
- `POST /api/voice/generate` - Generate speech from text
- `POST /api/voice/test` - Test voice generation
- `GET /api/voice/cleanup` - Clean up old audio files

### Call Endpoints
- `POST /api/call/place` - Place a call with audio
- `GET /api/call/status/:callId` - Get call status
- `GET /api/call/flow` - Call flow XML (webhook)
- `POST /api/call/complete` - Complete TTS + Call flow
- `GET /api/call/verify` - Verify Exotel credentials

### System Endpoints
- `GET /health` - Health check
- `/audio/*` - Serve audio files

## 🎭 Simulation Mode

When API credentials are not configured, the application automatically switches to simulation mode:

- **Mock Voices**: Provides sample voices for demonstration
- **Audio Generation**: Creates placeholder audio files
- **Call Simulation**: Simulates call progression without real calls
- **Status Updates**: Shows realistic call status transitions
- **Full Functionality**: All UI features work as expected

This allows full testing and demonstration without requiring actual API access.

## 🛡 Security Features

- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: No sensitive information in error messages
- **File Management**: Automatic cleanup of temporary files
- **Environment Variables**: Secure credential management

## 🧪 Testing

### Manual Testing
1. **Voice Generation Test**:
   ```bash
   curl -X POST http://localhost:3001/api/voice/test \
   -H "Content-Type: application/json" \
   -d '{"text": "Hello World", "voice_id": "mock-voice-1"}'
   ```

2. **Health Check**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **Get Voices**:
   ```bash
   curl http://localhost:3001/api/voice/voices
   ```

### Frontend Testing
- Open browser console for detailed logs
- Test with various text lengths and phone numbers
- Try different voice selections
- Monitor network requests in browser dev tools

## 📊 Monitoring & Logging

The application provides comprehensive logging:
- **Request Logging**: All HTTP requests are logged
- **Error Tracking**: Detailed error messages and stack traces
- **Performance Metrics**: Response times and status codes
- **API Status**: Connection status for external APIs
- **File Operations**: Audio file creation and cleanup logs

## 🚫 Limitations & Assumptions

### Current Limitations
- **Audio Format**: Only supports MP3 format
- **Text Length**: Maximum 5000 characters per request
- **File Storage**: Local storage (not cloud-based)
- **Phone Numbers**: Basic validation (may need country-specific formatting)
- **Concurrent Calls**: No advanced call queuing system

### Assumptions Made
- Users have valid phone numbers for testing
- ElevenLabs API key has sufficient credits
- Network connectivity is stable
- Modern browser with HTML5 audio support
- Local storage has sufficient space for audio files

## 🔧 Troubleshooting

### Common Issues

1. **Backend won't start**:
   - Check if port 3001 is available
   - Verify all dependencies are installed
   - Check `.env` file format

2. **Frontend can't connect to backend**:
   - Ensure backend is running on port 3001
   - Check CORS configuration
   - Verify proxy setting in frontend package.json

3. **Voice generation fails**:
   - Verify ElevenLabs API key
   - Check internet connectivity
   - Review API quota limits

4. **Calls not working**:
   - Verify Exotel credentials
   - Check phone number format
   - Ensure sufficient account balance (for real calls)

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## 🚀 Deployment Considerations

For production deployment:

1. **Environment Variables**: Use production API keys
2. **Build Optimization**: Run `npm run build` for both frontend and backend
3. **Process Manager**: Use PM2 or similar for backend process management
4. **Reverse Proxy**: Configure Nginx or Apache for production serving
5. **SSL Certificates**: Enable HTTPS for security
6. **Database**: Consider using a database for call logs and user data
7. **Cloud Storage**: Move audio files to cloud storage (AWS S3, etc.)
8. **CDN**: Use CDN for faster audio file delivery

## 📝 Development Notes

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent error handling patterns
- Comprehensive input validation
- RESTful API design principles

### Performance Optimizations
- Efficient file handling for audio generation
- Automatic cleanup of temporary files
- Optimized React rendering with proper state management
- Cached voice list to reduce API calls

### Scalability Considerations
- Modular service architecture
- Stateless API design
- Configurable rate limiting
- Extensible voice and telephony providers

## 🤝 Contributing

To extend this project:
1. Follow existing code patterns
2. Add comprehensive error handling
3. Include appropriate logging
4. Test in both simulation and real API modes
5. Update documentation for new features

## 📄 License

This project is created for internship assignment purposes. Please check with the assignment provider for specific license terms.

## 🎉 Conclusion

This Voice Over AI Agent demonstrates a complete integration between modern web technologies, AI-powered voice generation, and cloud telephony services. The application showcases:

- **Full-stack Development**: React frontend with Node.js backend
- **API Integration**: Multiple external service integrations
- **User Experience**: Intuitive interface with real-time feedback
- **Error Handling**: Robust error recovery and simulation modes
- **Professional Code**: Production-ready code structure and practices

The project successfully meets all assignment requirements while providing additional features and robust error handling for a complete user experience.

---

**Contact**: For questions or support regarding this implementation, please refer to the assignment submission details.

**Demo**: The application works in full simulation mode without requiring any API keys, making it perfect for demonstration and testing purposes.
