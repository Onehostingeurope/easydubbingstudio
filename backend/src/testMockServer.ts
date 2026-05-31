import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('--- EASY DUBBING INTEGRATION CHECK ---');
console.log(`Supabase URL detected: ${SUPABASE_URL ? 'OK' : 'MISSING'}`);
console.log(`HeyGen API Key detected: ${process.env.HEYGEN_API_KEY ? 'OK' : 'MISSING (Server will fall back safely)'}`);

async function runLocalCheck() {
  console.log('\nStep 1: Checking Express Server status...');
  try {
    const health = await axios.get('http://localhost:5000/health');
    console.log('✔ Express Server Health Check: Success', health.data);
  } catch (err: any) {
    console.warn('❌ Express Server is not running locally. Please run "npm run dev" in the /backend folder first.');
    return;
  }

  console.log('\nStep 2: Fetching Supported Languages (cached via HeyGen)...');
  try {
    const langs = await axios.get('http://localhost:5000/api/heygen/languages');
    console.log(`✔ Languages retrieved: ${langs.data.languages?.length} target languages ready.`);
    console.log(`Fallback sample languages:`, langs.data.languages?.slice(0, 5));
  } catch (err: any) {
    console.error('❌ Language fetch failed:', err.message);
  }

  console.log('\nStep 3: Simulating HeyGen webhook event processing...');
  try {
    const mockWebhookPayload = {
      event_id: `evt_chk_${Date.now()}`,
      event_type: 'video_translation.completed',
      data: {
        id: 'hg_trans_mock_123',
        video_translation_id: 'hg_trans_mock_123',
        status: 'completed',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail_url: 'https://www.w3schools.com/images/w3schools_green.jpg',
        duration: 10.5
      }
    };

    const webhookRes = await axios.post('http://localhost:5000/api/webhooks/heygen', mockWebhookPayload);
    console.log('✔ Mock Webhook processed successfully:', webhookRes.data);
  } catch (err: any) {
    console.error('❌ Webhook simulation failed:', err.message);
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runLocalCheck();
