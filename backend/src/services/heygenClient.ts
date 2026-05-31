import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HEYGEN_API_BASE = 'https://api.heygen.com/v3';
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// Simple memory cache for supported languages
let cachedLanguages: string[] | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface HeyGenTranslationPayload {
  video: {
    type: 'url' | 'asset_id';
    url?: string;
    asset_id?: string;
  };
  output_languages: string[];
  mode: 'speed' | 'precision';
  title: string;
  enable_caption?: boolean;
  translate_audio_only?: boolean;
  enable_dynamic_duration?: boolean;
  disable_music_track?: boolean;
  enable_speech_enhancement?: boolean;
  callback_url?: string;
  callback_id?: string;
}

export interface HeyGenStatusResponse {
  id: string;
  status: 'queued' | 'in progress' | 'completed' | 'failed';
  language: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  failure_code?: string;
  failure_message?: string;
}

// Memory state for sandbox simulation mode
let mockProgress: Record<string, { status: 'queued' | 'in progress' | 'completed'; count: number }> = {};

/**
 * Handle API requests with retry mechanism for 429 Rate Limits
 */
async function heygenRequest<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  data?: any,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  // Sandbox Simulation mode interceptor
  if (process.env.SIMULATION_MODE === 'true') {
    console.log(`[SANDBOX SIMULATION] Intercepted HeyGen ${method} ${endpoint}`);
    
    if (endpoint.startsWith('/video-translations/languages')) {
      return {
        languages: ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Hindi', 'Arabic']
      } as any;
    }
    
    if (endpoint.startsWith('/video-translations') && method === 'POST') {
      const mockId = `hg_sim_${Math.random().toString(36).substring(2, 10)}`;
      return {
        video_translation_ids: [mockId]
      } as any;
    }
    
    if (endpoint.includes('/caption')) {
      return `1
00:00:01,000 --> 00:00:04,000
Welcome to Easy Dubbing Cinematic Studio!

2
00:00:04,500 --> 00:00:08,000
Your translation pipeline has rendered beautifully inside our simulation sandbox.` as any;
    }
    
    // Status checks
    const parts = endpoint.split('/');
    const translationId = parts[parts.length - 1];
    
    if (!mockProgress[translationId]) {
      mockProgress[translationId] = { status: 'queued', count: 0 };
    } else {
      mockProgress[translationId].count += 1;
      if (mockProgress[translationId].count === 1) {
        mockProgress[translationId].status = 'in progress';
      } else if (mockProgress[translationId].count >= 2) {
        mockProgress[translationId].status = 'completed';
      }
    }
    
    return {
      id: translationId,
      status: mockProgress[translationId].status,
      language: 'French',
      video_url: mockProgress[translationId].status === 'completed'
        ? 'https://www.w3schools.com/html/mov_bbb.mp4'
        : undefined,
      thumbnail_url: 'https://www.w3schools.com/images/w3schools_green.jpg',
      duration: 10.5
    } as any;
  }

  if (!HEYGEN_API_KEY) {
    throw new Error('HEYGEN_API_KEY is not configured on the server.');
  }

  const url = `${HEYGEN_API_BASE}${endpoint}`;
  const headers = {
    'X-Api-Key': HEYGEN_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    });
    // HeyGen v3 usually wraps responses in a "data" property
    return response.data.data !== undefined ? response.data.data : response.data;
  } catch (error: any) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;

    if (status === 429 && retries > 0) {
      console.warn(`HeyGen API returned 429 (Too Many Requests). Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return heygenRequest<T>(method, endpoint, data, retries - 1, delayMs * 2);
    }

    const message = axiosError.response?.data?.message || axiosError.message;
    console.error(`HeyGen API request failed on ${method} ${endpoint}:`, message);
    throw new Error(`HeyGen API Error (${status || 'Network'}): ${message}`);
  }
}

/**
 * List supported languages for translation
 */
export async function listSupportedLanguages(): Promise<string[]> {
  const now = Date.now();
  if (cachedLanguages && now < cacheExpiry) {
    return cachedLanguages;
  }

  try {
    const response = await heygenRequest<{ languages: string[] }>('GET', '/video-translations/languages');
    
    // Sort alphabetically for clean UI
    const languages = (response.languages || []).sort();
    
    cachedLanguages = languages;
    cacheExpiry = now + CACHE_TTL_MS;
    return languages;
  } catch (error) {
    console.error('Failed to fetch supported languages from HeyGen:', error);
    // Return a sensible fallback in case of issues to guarantee dashboard remains operational
    return [
      'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
      'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 
      'Dutch', 'Russian', 'Turkish', 'Vietnamese', 'Polish'
    ];
  }
}

/**
 * Submit video translation job to HeyGen
 */
export async function createVideoTranslation(
  payload: HeyGenTranslationPayload
): Promise<{ video_translation_id: string }[]> {
  // If the user submits multiple languages, we handle launching multiple HeyGen translation requests
  const outputLanguages = payload.output_languages;
  const translationIds: { video_translation_id: string }[] = [];

  for (const lang of outputLanguages) {
    const singlePayload = {
      video: payload.video,
      output_languages: [lang], // HeyGen API translates one language at a time per request
      mode: payload.mode,
      title: `${payload.title} (${lang})`,
      enable_caption: payload.enable_caption ?? true,
      translate_audio_only: payload.translate_audio_only ?? false,
      enable_dynamic_duration: payload.enable_dynamic_duration ?? true,
      disable_music_track: payload.disable_music_track ?? false,
      enable_speech_enhancement: payload.enable_speech_enhancement ?? false,
      callback_url: payload.callback_url,
      callback_id: payload.callback_id,
    };

    console.log(`Submitting translation to HeyGen for language ${lang}:`, JSON.stringify(singlePayload));
    
    const response = await heygenRequest<{ video_translation_ids?: string[]; video_translation_id?: string }>(
      'POST',
      '/video-translations',
      singlePayload
    );

    const transId = response.video_translation_ids && response.video_translation_ids[0]
      ? response.video_translation_ids[0]
      : (response.video_translation_id || '');

    translationIds.push({ video_translation_id: transId });
  }

  return translationIds;
}

/**
 * Retrieve translation job status
 */
export async function getVideoTranslationStatus(
  videoTranslationId: string
): Promise<HeyGenStatusResponse> {
  return heygenRequest<HeyGenStatusResponse>('GET', `/video-translations/${videoTranslationId}`);
}

/**
 * Download captions (SRT or VTT)
 */
export async function downloadCaption(
  videoTranslationId: string,
  format: 'srt' | 'vtt'
): Promise<string> {
  return heygenRequest<string>('GET', `/video-translations/${videoTranslationId}/caption?format=${format}`);
}
