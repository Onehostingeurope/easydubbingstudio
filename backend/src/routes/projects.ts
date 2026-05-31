import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  listSupportedLanguages,
  createVideoTranslation,
  getVideoTranslationStatus,
  downloadCaption,
  HeyGenTranslationPayload
} from '../services/heygenClient';

const router = Router();

// Initialize Supabase admin client to secure internal DB writes (e.g. updating credits)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null as any;

// Middleware to verify Supabase JWT token and populate req.user
async function authMiddleware(req: Request, res: Response, next: any) {
  if (!supabase) {
    console.warn('Supabase client is not initialized due to missing VITE_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY. Bypassing auth check for local tests.');
    (req as any).user = { id: '00000000-0000-0000-0000-000000000000', email: 'john.doe@dubbing.ai' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: `Authentication failed: ${err.message}` });
  }
}

/**
 * GET /api/heygen/languages
 * Fetch supported languages from HeyGen
 */
router.get('/heygen/languages', async (req: Request, res: Response) => {
  try {
    const languages = await listSupportedLanguages();
    return res.status(200).json({ languages });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects
 * Create project and submit to HeyGen
 */
router.post('/projects', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    title,
    source_type,
    source_video_url,
    source_asset_id,
    source_language,
    mode,
    output_languages,
    enable_caption,
    translate_audio_only,
    enable_speech_enhancement,
    disable_music_track,
    enable_dynamic_duration,
    proofread_enabled
  } = req.body;

  // Basic validation
  if (!title || !source_type || !output_languages || !output_languages.length) {
    return res.status(400).json({ error: 'Missing required project parameters.' });
  }

  try {
    // 1. Fetch user's profile and plan constraints
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userPlan = profile.plan;
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('name', userPlan)
      .single();

    if (planErr || !plan) {
      return res.status(500).json({ error: 'Billing plan details could not be retrieved.' });
    }

    // 2. Validate plan permissions
    if (output_languages.length > plan.max_languages_per_project) {
      return res.status(403).json({
        error: `Your subscription tier (${userPlan}) allows a maximum of ${plan.max_languages_per_project} target languages per project.`
      });
    }

    if (mode === 'precision' && !plan.allow_precision_mode) {
      return res.status(403).json({
        error: `Precision mode is not available on the ${userPlan} plan. Please upgrade to use Precision Mode.`
      });
    }

    if (proofread_enabled && !plan.allow_proofread) {
      return res.status(403).json({
        error: `Proofread mode is not available on the ${userPlan} plan. Please upgrade to use Proofread.`
      });
    }

    // 3. Compute credit cost estimate
    // Speed mode = 10 credits/lang, Precision = 20 credits/lang
    const creditsPerLanguage = mode === 'precision' ? 20 : 10;
    const estimatedCost = creditsPerLanguage * output_languages.length;

    if (profile.credits_balance < estimatedCost) {
      return res.status(402).json({
        error: `Insufficient credits. You need ${estimatedCost} credits to translate into ${output_languages.length} language(s), but only have ${profile.credits_balance} remaining.`
      });
    }

    // 4. Create Project Record in DB
    const { data: project, error: projectInsertErr } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        source_type,
        source_video_url: source_type === 'url' ? source_video_url : null,
        source_asset_id: source_type === 'asset_id' ? source_asset_id : null,
        source_language: source_language || 'auto-detect',
        mode,
        status: 'pending',
        enable_caption: enable_caption !== false,
        translate_audio_only: !!translate_audio_only,
        enable_speech_enhancement: !!enable_speech_enhancement,
        disable_music_track: !!disable_music_track,
        enable_dynamic_duration: enable_dynamic_duration !== false,
        proofread_enabled: !!proofread_enabled,
        credits_used: estimatedCost
      })
      .select('*')
      .single();

    if (projectInsertErr || !project) {
      throw new Error(`Project creation failed: ${projectInsertErr?.message}`);
    }

    // 5. Submit to HeyGen (server-side only)
    const callbackUrl = process.env.PUBLIC_APP_URL
      ? `${process.env.PUBLIC_APP_URL}/api/webhooks/heygen`
      : undefined;

    const heygenPayload: HeyGenTranslationPayload = {
      video: source_type === 'url' 
        ? { type: 'url', url: source_video_url }
        : { type: 'asset_id', asset_id: source_asset_id },
      output_languages,
      mode,
      title,
      enable_caption,
      translate_audio_only,
      enable_dynamic_duration,
      disable_music_track,
      enable_speech_enhancement,
      callback_url: callbackUrl,
      callback_id: project.id
    };

    let translationJobs: { video_translation_id: string }[] = [];
    try {
      translationJobs = await createVideoTranslation(heygenPayload);
    } catch (heygenErr: any) {
      // Revert project creation and error out
      await supabase.from('projects').delete().eq('id', project.id);
      return res.status(502).json({ error: `HeyGen Translation Submission failed: ${heygenErr.message}` });
    }

    // 6. Insert translations records in DB
    const translationRecords = translationJobs.map((job, idx) => ({
      project_id: project.id,
      user_id: user.id,
      heygen_video_translation_id: job.video_translation_id,
      language: output_languages[idx],
      status: 'pending'
    }));

    const { error: transErr } = await supabase
      .from('project_translations')
      .insert(translationRecords);

    if (transErr) {
      console.error('Failed to create translation records in database:', transErr);
    }

    // 7. Deduct credits and log usage
    const newBalance = profile.credits_balance - estimatedCost;
    await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('id', user.id);

    await supabase.from('usage_logs').insert({
      user_id: user.id,
      project_id: project.id,
      action: 'create_project',
      credits_used: estimatedCost,
      metadata: { estimatedCost, mode, output_languages }
    });

    // 8. Return successfully created project details
    return res.status(201).json({ projectId: project.id, message: 'Project submitted successfully.' });

  } catch (error: any) {
    console.error('Error in /api/projects:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects
 * Return current user's projects
 */
router.get('/projects', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        translations:project_translations(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ projects });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id
 * Return project details and translations
 */
router.get('/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        translations:project_translations(*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    return res.status(200).json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Helper to recalculate parent project status based on status mappings:
 * - If all translations completed, project status = completed.
 * - If some completed and some failed, project status = partial.
 * - If all failed, project status = failed.
 * - If any pending or running, project status = running.
 */
async function updateParentProjectStatus(projectId: string) {
  const { data: translations, error } = await supabase
    .from('project_translations')
    .select('status')
    .eq('project_id', projectId);

  if (error || !translations || translations.length === 0) return;

  const total = translations.length;
  const completed = translations.filter((t: any) => t.status === 'completed').length;
  const failed = translations.filter((t: any) => t.status === 'failed').length;
  const active = translations.filter((t: any) => t.status === 'pending' || t.status === 'running').length;

  let finalStatus = 'running';

  if (completed === total) {
    finalStatus = 'completed';
  } else if (failed === total) {
    finalStatus = 'failed';
  } else if (active === 0 && completed > 0 && failed > 0) {
    finalStatus = 'partial';
  } else if (active > 0) {
    finalStatus = 'running';
  }

  await supabase
    .from('projects')
    .update({ status: finalStatus })
    .eq('id', projectId);
}

/**
 * POST /api/projects/:id/refresh
 * Poll HeyGen for every active translation ID and update
 */
router.post('/projects/:id/refresh', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;

  try {
    // Verify ownership
    const { data: project, error: checkErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (checkErr || !project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Get active (non-final) translations
    const { data: translations, error: transErr } = await supabase
      .from('project_translations')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['pending', 'running']);

    if (transErr) throw transErr;

    // Refresh statuses against HeyGen API
    for (const trans of (translations || [])) {
      try {
        const hgStatus = await getVideoTranslationStatus(trans.heygen_video_translation_id);
        
        let status = 'running';
        if (hgStatus.status === 'queued') status = 'pending';
        if (hgStatus.status === 'in progress') status = 'running';
        if (hgStatus.status === 'completed') status = 'completed';
        if (hgStatus.status === 'failed') status = 'failed';

        await supabase
          .from('project_translations')
          .update({
            status,
            video_url: hgStatus.video_url || null,
            thumbnail_url: hgStatus.thumbnail_url || null,
            duration: hgStatus.duration || null,
            failure_code: hgStatus.failure_code || null,
            failure_message: hgStatus.failure_message || null
          })
          .eq('id', trans.id);

      } catch (err: any) {
        console.error(`Failed to refresh translation ${trans.heygen_video_translation_id}:`, err.message);
      }
    }

    // Update parent project status aggregate
    await updateParentProjectStatus(projectId);

    // Fetch and return the updated project object
    const { data: updatedProject } = await supabase
      .from('projects')
      .select(`
        *,
        translations:project_translations(*)
      `)
      .eq('id', projectId)
      .single();

    return res.status(200).json({ project: updatedProject });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:id/retry
 * Retry failed translation jobs
 */
router.post('/projects/:id/retry', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projectId = req.params.id;

  try {
    const { data: project, error: checkErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (checkErr || !project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Find failed translations
    const { data: failedTranslations, error: transErr } = await supabase
      .from('project_translations')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'failed');

    if (transErr) throw transErr;

    if (!failedTranslations || failedTranslations.length === 0) {
      return res.status(400).json({ error: 'No failed translations found in this project to retry.' });
    }

    const callbackUrl = process.env.PUBLIC_APP_URL
      ? `${process.env.PUBLIC_APP_URL}/api/webhooks/heygen`
      : undefined;

    // Resubmit each failed language job to HeyGen
    for (const trans of failedTranslations) {
      const heygenPayload: HeyGenTranslationPayload = {
        video: project.source_type === 'url'
          ? { type: 'url', url: project.source_video_url }
          : { type: 'asset_id', asset_id: project.source_asset_id },
        output_languages: [trans.language],
        mode: project.mode,
        title: project.title,
        enable_caption: project.enable_caption,
        translate_audio_only: project.translate_audio_only,
        enable_dynamic_duration: project.enable_dynamic_duration,
        disable_music_track: project.disable_music_track,
        enable_speech_enhancement: project.enable_speech_enhancement,
        callback_url: callbackUrl,
        callback_id: project.id
      };

      try {
        const jobs = await createVideoTranslation(heygenPayload);
        const newHeygenId = jobs[0].video_translation_id;

        // Update database with new HeyGen Translation ID, reset state to pending
        await supabase
          .from('project_translations')
          .update({
            heygen_video_translation_id: newHeygenId,
            status: 'pending',
            failure_code: null,
            failure_message: null
          })
          .eq('id', trans.id);

      } catch (err: any) {
        console.error(`Failed to submit retry for translation ${trans.id} (${trans.language}):`, err.message);
      }
    }

    // Set overall project status back to running/pending
    await supabase
      .from('projects')
      .update({ status: 'running' })
      .eq('id', projectId);

    return res.status(200).json({ message: 'Failed jobs have been resubmitted successfully.' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id/caption/:translationId
 * Proxy and download caption from HeyGen (formats: srt / vtt)
 */
router.get('/projects/:id/caption/:translationId', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const translationId = req.params.translationId;
  const format = (req.query.format as 'srt' | 'vtt') || 'srt';

  try {
    // Verify ownership
    const { data: translation, error } = await supabase
      .from('project_translations')
      .select('heygen_video_translation_id, status')
      .eq('id', translationId)
      .eq('user_id', user.id)
      .single();

    if (error || !translation) {
      return res.status(404).json({ error: 'Translation not found or unauthorized.' });
    }

    if (translation.status !== 'completed') {
      return res.status(400).json({ error: 'Captions are only available once translation is completed.' });
    }

    const captionContent = await downloadCaption(translation.heygen_video_translation_id, format);

    res.setHeader('Content-Disposition', `attachment; filename=caption_${translationId}.${format}`);
    res.setHeader('Content-Type', 'text/plain');
    return res.send(captionContent);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
export { updateParentProjectStatus };
