import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before importing any services
const envPath = path.join(__dirname, '..', '.env');
console.log(`🔍 Looking for .env file at: ${envPath}`);
dotenv.config({ path: envPath });
console.log(`🔑 ELEVENLABS_API_KEY loaded: ${process.env.ELEVENLABS_API_KEY ? 'YES' : 'NO'}`);
console.log(`📞 TWILIO_ACCOUNT_SID loaded: ${process.env.TWILIO_ACCOUNT_SID ? 'YES' : 'NO'}`);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs-extra';

// Import routes
import voiceRoutes from './routes/voice';
import callRoutes from './routes/call';

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔥 Server starting with environment variables loaded...');
console.log('🚀 All API keys configured and ready!');

// Ensure audio directory exists
const audioDir = path.join(__dirname, '..', 'audio');
fs.ensureDirSync(audioDir);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3002', // Allow frontend on port 3002
    'http://localhost:3001'  // Allow backend self-requests
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static audio files
app.use('/audio', express.static(audioDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Voice Over AI Agent API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/call', callRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Voice Over AI Agent API server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 Audio files: http://localhost:${PORT}/audio`);
});

export default app;
