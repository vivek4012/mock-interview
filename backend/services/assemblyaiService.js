import { createError } from '../utils/errors.js';

class AssemblyAIService {
  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async createRealtimeSession(options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('AssemblyAI API key is not configured');
      }

      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      const maxSessionDurationSeconds = options.maxSessionDurationSeconds || 3600;

      // Universal Streaming API v3 endpoint
      const url = new URL('https://streaming.assemblyai.com/v3/token');
      url.searchParams.append('expires_in_seconds', expiresInSeconds.toString());
      url.searchParams.append('max_session_duration_seconds', maxSessionDurationSeconds.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': this.apiKey
        }
      });

      const responseText = await response.text();
      console.log('AssemblyAI Response Status:', response.status);
      console.log('AssemblyAI Response:', responseText);

      if (!response.ok) {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (e) {
          error = { message: responseText || 'Failed to create realtime session' };
        }

        // Check if it's an account upgrade issue
        if (response.status === 402 || (error.error && error.error.includes('upgrade'))) {
          throw new Error('AssemblyAI real-time streaming requires an upgraded account. Please upgrade at https://app.assemblyai.com/');
        }

        throw new Error(error.error || error.message || 'Failed to create realtime session');
      }

      const data = JSON.parse(responseText);

      return {
        token: data.token,
        expires_at: Date.now() + (data.expires_in_seconds * 1000)
      };
    } catch (error) {
      console.error('AssemblyAI Token Generation Error:', error);
      throw this._handleAssemblyAIError(error);
    }
  }

  _handleAssemblyAIError(error) {
    if (error.status === 401) {
      return createError(500, 'AssemblyAI API authentication failed');
    } else if (error.status === 429) {
      return createError(503, 'AssemblyAI API rate limit exceeded. Please try again later.');
    } else if (error.status >= 500) {
      return createError(503, 'AssemblyAI service is currently unavailable');
    } else if (error.status === 400) {
      return createError(400, `Invalid request: ${error.message}`);
    } else {
      return createError(500, `AssemblyAI API error: ${error.message}`);
    }
  }
}

export default new AssemblyAIService();
