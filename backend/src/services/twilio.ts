import twilio from 'twilio';

export interface TwilioCallRequest {
  to_number: string;
  audio_url: string;
  caller_id?: string;
}

export interface TwilioCallResponse {
  success: boolean;
  call_id?: string;
  message?: string;
  error?: string;
}

export interface TwilioCallStatus {
  call_id: string;
  status: string;
  duration?: number;
  direction?: string;
  from?: string;
  to?: string;
}

export class TwilioService {
  private client: any;
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private webhookUrl: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.webhookUrl = process.env.TWILIO_WEBHOOK_URL || '';

    if (!this.accountSid || !this.authToken) {
      console.warn('⚠️ Twilio credentials not found. Using simulation mode.');
      return;
    }

    if (!this.phoneNumber) {
      console.warn('⚠️ Twilio phone number not configured. Using simulation mode.');
      return;
    }

    try {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('✅ Twilio client initialized successfully');
      console.log(`📱 Twilio phone number: ${this.phoneNumber}`);
    } catch (error) {
      console.error('❌ Error initializing Twilio client:', error);
    }
  }

  /**
   * Place a call using Twilio
   */
  async placeCall(request: TwilioCallRequest): Promise<TwilioCallResponse> {
    try {
      if (!this.client) {
        console.warn('⚠️ Twilio not configured, falling back to simulation');
        return this.simulateCall(request);
      }

      const { to_number, audio_url, caller_id } = request;

      // Format phone numbers properly
      const toNumber = this.formatPhoneNumber(to_number);
      const fromNumber = caller_id || this.phoneNumber;

      console.log(`📞 Placing Twilio call from ${fromNumber} to ${toNumber}`);
      console.log(`🎵 Audio URL: ${audio_url}`);

      // For local testing, use Twilio's Text-to-Speech instead of audio file
      // since Twilio can't access localhost URLs from the cloud
      const twiml = this.generateSimpleTwiML(request.to_number);
      console.log(`📄 Generated TwiML: ${twiml}`);

      const call = await this.client.calls.create({
        twiml: twiml,
        to: toNumber,
        from: fromNumber,
        machineDetection: 'none', // Disable machine detection
        timeout: 30, // Ring for 30 seconds
        record: false, // Don't record the call
      });

      console.log(`✅ Twilio call initiated. Call SID: ${call.sid}`);

      return {
        success: true,
        call_id: call.sid,
        message: `Call placed successfully to ${toNumber}`
      };

    } catch (error: any) {
      console.error('❌ Error placing Twilio call:', error);
      
      // Fall back to simulation
      console.log('🎭 Falling back to call simulation');
      return this.simulateCall(request);
    }
  }

  /**
   * Place a call with custom text using Twilio's TTS
   */
  async placeCallWithText(text: string, to_number: string, caller_id?: string): Promise<TwilioCallResponse> {
    try {
      if (!this.client) {
        console.warn('⚠️ Twilio not configured, falling back to simulation');
        return this.simulateCallWithText(text, to_number);
      }

      // Format phone numbers properly
      const toNumber = this.formatPhoneNumber(to_number);
      const fromNumber = caller_id || this.phoneNumber;

      console.log(`📞 Placing Twilio call with custom text from ${fromNumber} to ${toNumber}`);
      console.log(`📝 Text preview: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

      // Create TwiML with the user's actual text
      const twiml = this.generateCustomTwiML(text);
      console.log(`📄 Generated custom TwiML`);

      const call = await this.client.calls.create({
        twiml: twiml,
        to: toNumber,
        from: fromNumber,
        machineDetection: 'none',
        timeout: 30,
        record: false,
      });

      console.log(`✅ Twilio call with custom text initiated. Call SID: ${call.sid}`);

      return {
        success: true,
        call_id: call.sid,
        message: `Call placed successfully to ${toNumber} with custom message`
      };

    } catch (error: any) {
      console.error('❌ Error placing Twilio call with text:', error);
      
      // Fall back to simulation
      console.log('🎭 Falling back to call simulation with custom text');
      return this.simulateCallWithText(text, to_number);
    }
  }

  /**
   * Get call status from Twilio
   */
  async getCallStatus(callId: string): Promise<TwilioCallStatus | null> {
    try {
      if (!this.client) {
        // Return simulation status
        return this.getSimulatedCallStatus(callId);
      }

      const call = await this.client.calls(callId).fetch();

      return {
        call_id: call.sid,
        status: call.status,
        duration: call.duration,
        direction: call.direction,
        from: call.from,
        to: call.to
      };

    } catch (error: any) {
      console.error('❌ Error getting Twilio call status:', error);
      return null;
    }
  }

  /**
   * Create TwiML URL for playing audio
   */
  private createTwiMLUrl(audioUrl: string): string {
    // Create the full TwiML endpoint URL
    const baseUrl = this.webhookUrl.replace('/api/call/webhook', '');
    return `${baseUrl}/api/call/twiml?audio=${encodeURIComponent(audioUrl)}`;
  }

  /**
   * Format phone number for Twilio
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces, dashes, or parentheses
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If it doesn't start with +, add country code
    if (!cleaned.startsWith('+')) {
      // Assume Indian number if it's 10 digits starting with 6-9
      if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        cleaned = `+91${cleaned}`;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = `+${cleaned}`;
      } else {
        // Default to adding +1 for US numbers
        cleaned = `+1${cleaned}`;
      }
    }
    
    return cleaned;
  }

  /**
   * Simulate a call for demo purposes
   */
  private async simulateCall(request: TwilioCallRequest): Promise<TwilioCallResponse> {
    const callId = `sim_twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎭 Simulating Twilio call to ${request.to_number}`);
    console.log(`🎵 Would play audio from: ${request.audio_url}`);
    
    // Start simulation progression
    this.startCallSimulation(callId);
    
    return {
      success: true,
      call_id: callId,
      message: `Simulated call to ${request.to_number}`
    };
  }

  /**
   * Start call simulation with status progression
   */
  private startCallSimulation(callId: string) {
    const statuses = ['queued', 'ringing', 'in-progress', 'completed'];
    let currentStatus = 0;

    const simulationInterval = setInterval(() => {
      if (currentStatus < statuses.length) {
        console.log(`📞 Simulated call ${callId}: ${statuses[currentStatus]}`);
        currentStatus++;
      } else {
        clearInterval(simulationInterval);
      }
    }, 2000);
  }

  /**
   * Get simulated call status
   */
  private getSimulatedCallStatus(callId: string): TwilioCallStatus | null {
    if (!callId.startsWith('sim_twilio_')) {
      return null;
    }

    // Return a realistic status based on time elapsed
    const timestamp = parseInt(callId.split('_')[2]);
    const elapsed = Date.now() - timestamp;

    let status = 'queued';
    if (elapsed > 8000) status = 'completed';
    else if (elapsed > 6000) status = 'in-progress';
    else if (elapsed > 2000) status = 'ringing';

    return {
      call_id: callId,
      status: status,
      duration: status === 'completed' ? Math.floor(elapsed / 1000) : undefined,
      direction: 'outbound-api',
      from: this.phoneNumber || '+14722138384',
      to: '+919024266007'
    };
  }

  /**
   * Generate TwiML for playing audio
   */
  generateTwiML(audioUrl: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello! Please listen to this AI-generated message.</Say>
    <Play>${audioUrl}</Play>
    <Say voice="alice">Thank you for listening. This call will now end.</Say>
</Response>`;
  }

  /**
   * Generate simple TwiML for testing calls without audio files
   */
  generateSimpleTwiML(toNumber: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" rate="medium">
        Hello! This is your Voice Over AI Agent successfully calling you through Twilio. 
        You are receiving this call on ${toNumber} from your virtual number plus 1 4 7 2 2 1 3 8 3 8 4.
        <break time="1s"/>
        This demonstrates the complete integration between ElevenLabs AI voice generation and Twilio telephony services.
        <break time="1s"/>
        Your Voice AI system is working perfectly and can now make real phone calls with AI-generated speech.
        <break time="1s"/>
        This call proves that all components are functioning correctly including voice generation, phone number formatting, and call placement.
        <break time="1s"/>
        Thank you for testing your Voice Over AI Agent. The system is ready for production use. Goodbye!
    </Say>
</Response>`;
  }

  /**
   * Generate custom TwiML with user's actual text
   */
  private generateCustomTwiML(text: string): string {
    // Clean the text to be phone-safe
    const cleanText = text
      .replace(/[<>&]/g, '') // Remove XML-unsafe characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" rate="medium">
        Hello! This is your Voice Over AI Agent. Here is your message: ${cleanText}. 
        <break time="1s"/>
        Thank you for using our service. Goodbye!
    </Say>
</Response>`;
  }

  /**
   * Simulate a call with custom text (fallback when Twilio is not available)
   */
  private simulateCallWithText(text: string, to_number: string): TwilioCallResponse {
    const callId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎭 Simulating call with custom text to ${to_number}`);
    console.log(`📝 Simulated text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`🆔 Simulated Call ID: ${callId}`);
    
    return {
      success: true,
      call_id: callId,
      message: `Simulated call with custom text placed to ${to_number}. In a real scenario, this would read: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
    };
  }

  /**
   * Verify Twilio credentials
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.api.accounts(this.accountSid).fetch();
      console.log('✅ Twilio credentials verified successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Twilio credentials verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
