import express from 'express';
import { twilioService, TwilioCallRequest } from '../services/twilio';
import exotelService, { CallRequest } from '../services/exotel';

const router = express.Router();

/**
 * POST /api/call/place
 * Place a call with AI-generated voice
 */
router.post('/place', async (req, res) => {
  try {
    const { to_number, audio_url, caller_id } = req.body;

    // Validate required fields
    if (!to_number || !audio_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both to_number and audio_url are required',
      });
    }

    console.log(`📞 Initiating call to ${to_number} with audio: ${audio_url}`);

    // Try Twilio first, then fall back to Exotel
    let result;
    
    // Prepare Twilio request
    const twilioRequest: TwilioCallRequest = {
      to_number,
      audio_url,
      caller_id,
    };

    result = await twilioService.placeCall(twilioRequest);

    // If Twilio fails, fall back to Exotel
    if (!result.success && result.error) {
      console.log('� Twilio failed, trying Exotel fallback...');
      
      const formattedNumber = exotelService.formatPhoneNumber(to_number);
      const exotelRequest: CallRequest = {
        to_number: formattedNumber,
        audio_url,
        caller_id,
      };
      
      result = await exotelService.placeCall(exotelRequest);
    }

    if (result.success) {
      res.json({
        success: true,
        call_id: result.call_id,
        message: result.message,
        provider: result.call_id?.startsWith('CA') ? 'twilio' : (result.call_id?.startsWith('sim_twilio_') ? 'twilio_sim' : 'exotel'),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to place call',
      });
    }
  } catch (error: any) {
    console.error('❌ Error placing call:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/call/status/:callId
 * Get call status
 */
router.get('/status/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    if (!callId) {
      return res.status(400).json({
        success: false,
        error: 'Missing call ID',
      });
    }

    console.log(`📊 Getting status for call: ${callId}`);

    let status;
    
    // Check if it's a Twilio call (starts with CA or sim_twilio_)
    if (callId.startsWith('CA') || callId.startsWith('sim_twilio_')) {
      status = await twilioService.getCallStatus(callId);
    } else {
      // Try Exotel for other call IDs
      status = await exotelService.getCallStatus(callId);
    }

    if (status) {
      res.json({
        success: true,
        call_status: status,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Call not found',
      });
    }
  } catch (error: any) {
    console.error('❌ Error getting call status:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/call/flow
 * Generate call flow XML for Exotel (webhook endpoint)
 */
router.get('/flow', (req, res) => {
  try {
    const audioUrl = req.query.audio as string;

    if (!audioUrl) {
      return res.status(400).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman">Error: No audio URL provided.</Say>
</Response>`);
    }

    console.log(`🎵 Generating call flow for audio: ${audioUrl}`);

    const xml = exotelService.generateCallFlowXML(audioUrl);
    
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (error: any) {
    console.error('❌ Error generating call flow:', error.message);
    
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman">Error occurred while processing the call flow.</Say>
</Response>`;
    
    res.set('Content-Type', 'text/xml');
    res.status(500).send(errorXml);
  }
});

/**
 * POST /api/call/complete
 * Complete call flow - process text-to-speech and initiate call
 */
router.post('/complete', async (req, res) => {
  try {
    const { text, voice_id, to_number, caller_id } = req.body;

    // Validate required fields
    if (!text || !voice_id || !to_number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'text, voice_id, and to_number are required',
      });
    }

    console.log(`🔄 Starting complete call flow for ${to_number}`);
    console.log(`📝 Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`🎤 Voice: ${voice_id}`);

    // Step 1: Generate speech using ElevenLabs
    const elevenLabsService = require('../services/elevenLabs').default;
    
    const ttsResult = await elevenLabsService.generateSpeech({
      text,
      voice_id,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    });

    if (!ttsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate speech',
        message: ttsResult.error,
      });
    }

    console.log(`✅ Speech generated: ${ttsResult.audio_url}`);

    // Step 2: Place call with Twilio using the original text
    // Instead of using the audio file, use the original text with Twilio's TTS
    const twilioCallRequest: TwilioCallRequest = {
      to_number,
      audio_url: '', // Not needed for our current implementation
      caller_id,
    };

    // For now, use Twilio with the original text directly
    const callResult = await twilioService.placeCallWithText(text, to_number, caller_id);

    if (callResult.success) {
      res.json({
        success: true,
        message: callResult.message || 'Call initiated successfully',
        call_id: callResult.call_id,
        audio_url: ttsResult.audio_url,
        call_status: 'initiated',
        simulation: callResult.call_id?.startsWith('sim_') || false,
      });
    } else {
      res.status(500).json({
        success: false,
        error: callResult.error || 'Failed to place call',
        message: callResult.message,
        audio_url: ttsResult.audio_url, // Still return audio URL for debugging
      });
    }
  } catch (error: any) {
    console.error('❌ Error in complete call flow:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/call/verify
 * Verify Exotel account and configuration
 */
router.get('/verify', async (req, res) => {
  try {
    console.log('🔍 Verifying Exotel account...');
    
    const verification = await exotelService.verifyAccount();
    
    res.json({
      success: true,
      account_verified: verification.valid,
      message: verification.message,
    });
  } catch (error: any) {
    console.error('❌ Error verifying account:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/call/twiml
 * Generate TwiML for Twilio webhooks
 */
router.get('/twiml', async (req, res) => {
  try {
    const { audio } = req.query;

    if (!audio) {
      return res.status(400).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Error: No audio URL provided.</Say>
</Response>`);
    }

    const audioUrl = decodeURIComponent(audio as string);
    const twiml = twilioService.generateTwiML(audioUrl);

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (error: any) {
    console.error('❌ Error generating TwiML:', error);
    
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Error generating call content.</Say>
</Response>`);
  }
});

/**
 * POST /api/call/webhook/status
 * Handle Twilio status callbacks
 */
router.post('/webhook/status', (req, res) => {
  try {
    const { CallSid, CallStatus, From, To, Duration } = req.body;
    
    console.log(`📞 Twilio status update: ${CallSid} - ${CallStatus}`);
    console.log(`📱 Call details: ${From} -> ${To}, Duration: ${Duration}s`);
    
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('❌ Error handling Twilio webhook:', error);
    res.status(500).send('Error');
  }
});

export default router;
