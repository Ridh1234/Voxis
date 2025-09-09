import axios from 'axios';

export interface CallRequest {
  to_number: string;
  audio_url: string;
  caller_id?: string;
}

export interface CallResponse {
  success: boolean;
  call_id?: string;
  status?: string;
  message?: string;
  error?: string;
  simulation?: boolean;
}

export interface CallStatus {
  call_id: string;
  status: string;
  duration?: number;
  start_time?: string;
  end_time?: string;
}

class ExotelService {
  private apiKey: string;
  private apiToken: string;
  private accountSid: string;
  private baseUrl: string;
  private virtualNumber: string;

  constructor() {
    this.apiKey = process.env.EXOTEL_API_KEY || '';
    this.apiToken = process.env.EXOTEL_API_TOKEN || '';
    this.accountSid = process.env.EXOTEL_SID || '';
    this.baseUrl = process.env.EXOTEL_BASE_URL || 'https://api.exotel.com/v1/Accounts';
    this.virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER || '';

    if (!this.apiKey || !this.apiToken || !this.accountSid) {
      console.warn('⚠️ Exotel credentials not fully configured. Using simulation mode.');
    }
  }

  /**
   * Place a call using Exotel Connect API
   */
  async placeCall(request: CallRequest): Promise<CallResponse> {
    try {
      // Check if we have proper Exotel configuration
      if (!this.apiKey || !this.apiToken || !this.accountSid) {
        console.log('🎭 Simulating call due to missing Exotel configuration');
        return this.simulateCall(request);
      }

      const { to_number, audio_url, caller_id } = request;
      
      // Validate phone number format
      if (!this.isValidPhoneNumber(to_number)) {
        throw new Error('Invalid phone number format');
      }

      console.log(`📞 Placing call to ${to_number} with audio: ${audio_url}`);

      // Prepare Exotel Connect API request
      const connectUrl = `${this.baseUrl}/${this.accountSid}/Calls/connect.json`;
      
      // Ensure proper number formatting for Exotel
      const fromNumber = caller_id || this.virtualNumber;
      const formattedFromNumber = fromNumber.startsWith('+') ? fromNumber : `+91${fromNumber}`;
      
      const payload = {
        From: formattedFromNumber,
        To: to_number,
        Url: this.createCallFlowUrl(audio_url), // URL that returns TwiML/ExoML
        Method: 'GET',
        CallType: 'trans',
        CallerId: formattedFromNumber,
      };

      const response = await axios.post(connectUrl, payload, {
        auth: {
          username: this.apiKey,
          password: this.apiToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const callData = response.data;
      
      console.log(`✅ Call placed successfully. Call ID: ${callData.Call?.Sid}`);

      return {
        success: true,
        call_id: callData.Call?.Sid,
        status: callData.Call?.Status,
        message: 'Call initiated successfully',
      };
    } catch (error: any) {
      console.error('❌ Error placing call:', error.response?.data || error.message);
      
      // Fallback to simulation
      console.log('🎭 Falling back to call simulation');
      return this.simulateCall(request);
    }
  }

  /**
   * Get call status from Exotel
   */
  async getCallStatus(callId: string): Promise<CallStatus | null> {
    try {
      if (!this.apiKey || !this.apiToken || !this.accountSid) {
        return this.getSimulatedCallStatus(callId);
      }

      const statusUrl = `${this.baseUrl}/${this.accountSid}/Calls/${callId}.json`;

      const response = await axios.get(statusUrl, {
        auth: {
          username: this.apiKey,
          password: this.apiToken,
        },
      });

      const callData = response.data.Call;

      return {
        call_id: callData.Sid,
        status: callData.Status,
        duration: callData.Duration ? parseInt(callData.Duration) : undefined,
        start_time: callData.StartTime,
        end_time: callData.EndTime,
      };
    } catch (error: any) {
      console.error('❌ Error getting call status:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Simulate a call for demo purposes
   */
  private async simulateCall(request: CallRequest): Promise<CallResponse> {
    const callId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎭 Simulating call to ${request.to_number}`);
    console.log(`🎵 Would play audio from: ${request.audio_url}`);
    
    // Simulate call progression
    setTimeout(() => {
      console.log(`📞 Simulated call ${callId}: Ringing...`);
    }, 1000);

    setTimeout(() => {
      console.log(`📞 Simulated call ${callId}: Answered`);
    }, 3000);

    setTimeout(() => {
      console.log(`📞 Simulated call ${callId}: Playing audio...`);
    }, 5000);

    setTimeout(() => {
      console.log(`📞 Simulated call ${callId}: Call completed`);
    }, 15000);

    return {
      success: true,
      call_id: callId,
      status: 'initiated',
      message: 'Call simulation started successfully',
      simulation: true,
    };
  }

  /**
   * Get simulated call status
   */
  private getSimulatedCallStatus(callId: string): CallStatus {
    const elapsed = Date.now() - parseInt(callId.split('_')[1]);
    
    let status = 'initiated';
    if (elapsed > 15000) status = 'completed';
    else if (elapsed > 5000) status = 'in-progress';
    else if (elapsed > 3000) status = 'answered';
    else if (elapsed > 1000) status = 'ringing';

    return {
      call_id: callId,
      status,
      duration: elapsed > 15000 ? Math.floor((elapsed - 5000) / 1000) : undefined,
      start_time: new Date(parseInt(callId.split('_')[1]) + 5000).toISOString(),
      end_time: elapsed > 15000 ? new Date(parseInt(callId.split('_')[1]) + 15000).toISOString() : undefined,
    };
  }

  /**
   * Create a call flow URL that returns ExoML for playing audio
   */
  private createCallFlowUrl(audioUrl: string): string {
    // In a real implementation, this would point to your server endpoint
    // that returns ExoML (Exotel's XML format) with <Play> instruction
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
    return `${serverUrl}/api/call/flow?audio=${encodeURIComponent(audioUrl)}`;
  }

  /**
   * Generate ExoML for playing audio
   */
  generateCallFlowXML(audioUrl: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="woman">Hello! I will now play your AI generated message.</Say>
    <Pause length="1"/>
    <Play>${audioUrl}</Play>
    <Say voice="woman">Thank you for using Voice Over AI Agent. Goodbye!</Say>
</Response>`;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (typically 10-15 digits)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Format phone number for Exotel (add country code if missing)
   */
  formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming India +91 as default)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Get account information and verify credentials
   */
  async verifyAccount(): Promise<{ valid: boolean; message: string }> {
    try {
      if (!this.apiKey || !this.apiToken || !this.accountSid) {
        return {
          valid: false,
          message: 'Exotel credentials not configured. Using simulation mode.',
        };
      }

      const accountUrl = `${this.baseUrl}/${this.accountSid}.json`;

      const response = await axios.get(accountUrl, {
        auth: {
          username: this.apiKey,
          password: this.apiToken,
        },
      });

      console.log('✅ Exotel account verified successfully');
      
      return {
        valid: true,
        message: 'Exotel account verified successfully',
      };
    } catch (error: any) {
      console.error('❌ Exotel account verification failed:', error.response?.data || error.message);
      
      return {
        valid: false,
        message: 'Exotel account verification failed. Using simulation mode.',
      };
    }
  }
}

export default new ExotelService();
