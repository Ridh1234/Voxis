import express from 'express';
import elevenLabsService, { TTSRequest } from '../services/elevenLabs';

const router = express.Router();

/**
 * GET /api/voice/voices
 * Get available voices from ElevenLabs
 */
router.get('/voices', async (req, res) => {
  try {
    console.log('🎤 Fetching available voices...');
    
    const voices = await elevenLabsService.getVoices();
    
    res.json({
      success: true,
      voices,
      count: voices.length,
    });
  } catch (error: any) {
    console.error('❌ Error fetching voices:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voices',
      message: error.message,
    });
  }
});

/**
 * POST /api/voice/generate
 * Generate speech from text using ElevenLabs TTS
 */
router.post('/generate', async (req, res) => {
  try {
    const { text, voice_id, voice_settings } = req.body;

    // Validate required fields
    if (!text || !voice_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both text and voice_id are required',
      });
    }

    // Validate text length
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long',
        message: 'Text must be less than 5000 characters',
      });
    }

    console.log(`🎵 Generating speech for voice: ${voice_id}`);
    console.log(`📝 Text preview: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    const ttsRequest: TTSRequest = {
      text,
      voice_id,
      voice_settings: voice_settings || {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

    const result = await elevenLabsService.generateSpeech(ttsRequest);

    if (result.success) {
      res.json({
        success: true,
        audio_url: result.audio_url,
        filename: result.filename,
        message: 'Speech generated successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate speech',
      });
    }
  } catch (error: any) {
    console.error('❌ Error generating speech:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/voice/test
 * Test endpoint for quick voice generation
 */
router.post('/test', async (req, res) => {
  try {
    const testText = req.body.text || "Hello! This is a test of the Voice Over AI Agent. The system is working correctly.";
    const testVoiceId = req.body.voice_id || 'mock-voice-1';

    console.log('🧪 Testing voice generation...');

    const ttsRequest: TTSRequest = {
      text: testText,
      voice_id: testVoiceId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    };

    const result = await elevenLabsService.generateSpeech(ttsRequest);

    res.json({
      success: true,
      test: true,
      result,
      request: ttsRequest,
    });
  } catch (error: any) {
    console.error('❌ Error in voice test:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Voice test failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/voice/cleanup
 * Clean up old audio files (for maintenance)
 */
router.get('/cleanup', async (req, res) => {
  try {
    const maxAgeHours = parseInt(req.query.hours as string) || 24;
    
    console.log(`🗑️ Cleaning up audio files older than ${maxAgeHours} hours...`);
    
    await elevenLabsService.cleanupOldFiles(maxAgeHours);
    
    res.json({
      success: true,
      message: `Cleaned up audio files older than ${maxAgeHours} hours`,
    });
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message,
    });
  }
});

export default router;
