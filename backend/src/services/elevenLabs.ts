import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
}

export interface TTSRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TTSResponse {
  success: boolean;
  audio_url?: string;
  filename?: string;
  error?: string;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string;
  private audioDir: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    this.baseUrl = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1';
    this.audioDir = path.join(__dirname, '..', '..', 'audio');
    
    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API key not found. Please set ELEVENLABS_API_KEY in your .env file');
    }
    
    // Ensure audio directory exists
    fs.ensureDirSync(this.audioDir);
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices(): Promise<Voice[]> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey,
        },
      });

      const voices = response.data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url,
      }));

      console.log(`✅ Retrieved ${voices.length} voices from ElevenLabs`);
      return voices;
    } catch (error: any) {
      console.error('❌ Error fetching voices from ElevenLabs:', error.response?.data || error.message);
      
      // Return mock voices for development/demo
      return this.getMockVoices();
    }
  }

  /**
   * Generate speech from text using ElevenLabs TTS
   */
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ ElevenLabs API key not configured, using mock audio generation');
        return this.generateMockAudio(request);
      }

      const { text, voice_id, model_id = 'eleven_monolingual_v1', voice_settings } = request;

      // Map mock voice IDs to real ElevenLabs voice IDs
      const realVoiceId = voice_id.startsWith('mock-') ? 'pNInz6obpgDQGcFmaJgB' : voice_id; // Adam voice as default

      const payload = {
        text,
        model_id,
        voice_settings: voice_settings || {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      };

      console.log(`🎵 Generating speech for voice: ${voice_id} -> ${realVoiceId}`);

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${realVoiceId}`,
        payload,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      );

      // Generate unique filename
      const filename = `tts_${uuidv4()}_${Date.now()}.mp3`;
      const filepath = path.join(this.audioDir, filename);

      // Save audio file
      await fs.writeFile(filepath, response.data);
      
      const audio_url = `/audio/${filename}`;
      
      console.log(`✅ Speech generated successfully: ${filename}`);
      
      return {
        success: true,
        audio_url,
        filename,
      };
    } catch (error: any) {
      console.error('❌ Error generating speech:', error.response?.data || error.message);
      
      // Fallback to mock audio for demo purposes
      return this.generateMockAudio(request);
    }
  }

  /**
   * Get mock voices for development/demo
   */
  private getMockVoices(): Voice[] {
    return [
      {
        voice_id: 'mock-voice-1',
        name: 'Rachel (Demo)',
        category: 'premade',
        description: 'American Female - Mock voice for demonstration',
      },
      {
        voice_id: 'mock-voice-2',
        name: 'Adam (Demo)',
        category: 'premade',
        description: 'American Male - Mock voice for demonstration',
      },
      {
        voice_id: 'mock-voice-3',
        name: 'Domi (Demo)',
        category: 'premade',
        description: 'American Female - Mock voice for demonstration',
      },
      {
        voice_id: 'mock-voice-4',
        name: 'Fin (Demo)',
        category: 'premade',
        description: 'Irish Male - Mock voice for demonstration',
      },
    ];
  }

  /**
   * Generate mock audio file for development/demo
   */
  private async generateMockAudio(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Create a simple mock audio file (empty MP3 header)
      const filename = `mock_tts_${uuidv4()}_${Date.now()}.mp3`;
      const filepath = path.join(this.audioDir, filename);
      
      // Create a minimal MP3 file with ID3 header
      const mockAudioData = Buffer.from([
        // ID3v2 header
        0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        // MP3 frame header (minimal)
        0xFF, 0xFB, 0x90, 0x00,
      ]);
      
      await fs.writeFile(filepath, mockAudioData);
      
      const audio_url = `/audio/${filename}`;
      
      console.log(`🎭 Mock speech generated: ${filename} for text: "${request.text.substring(0, 50)}..."`);
      
      return {
        success: true,
        audio_url,
        filename,
      };
    } catch (error: any) {
      console.error('❌ Error generating mock audio:', error.message);
      return {
        success: false,
        error: 'Failed to generate mock audio',
      };
    }
  }

  /**
   * Clean up old audio files to save disk space
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.audioDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      for (const file of files) {
        const filepath = path.join(this.audioDir, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filepath);
          console.log(`🗑️ Cleaned up old audio file: ${file}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error cleaning up audio files:', error.message);
    }
  }
}

export default new ElevenLabsService();
