import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { updateParentProjectStatus } from './projects';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null as any;

/**
 * Verify HeyGen Webhook Signature
 */
function verifyHeyGenSignature(req: Request): boolean {
  const webhookSecret = process.env.HEYGEN_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If secret is not set, we log a warning but bypass validation in development
    console.warn('HEYGEN_WEBHOOK_SECRET is not configured. Webhook signature verification is skipped.');
    return true;
  }

  const signature = req.headers['x-heygen-signature'] as string;
  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * POST /api/webhooks/heygen
 * Receives HeyGen callback payload
 */
router.post('/heygen', async (req: Request, res: Response) => {
  console.log('Received HeyGen webhook payload:', JSON.stringify(req.body));

  // 1. Verify Signature
  if (!verifyHeyGenSignature(req)) {
    console.error('Invalid HeyGen webhook signature.');
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }

  const payload = req.body;
  const eventId = payload.event_id || `hg_evt_${Date.now()}`;
  const eventType = payload.event_type || 'video_translation';
  const eventData = payload.data || {};
  const translationId = eventData.video_translation_id || eventData.id;

  if (!translationId) {
    console.warn('HeyGen webhook did not contain a translation ID.');
    return res.status(400).json({ error: 'No translation ID provided.' });
  }

  if (!supabase) {
    console.warn('Supabase client is not initialized due to missing credentials. Simulating successful webhook verification.');
    return res.status(200).json({ status: 'simulated_success', message: 'Webhook processed simulated successfully.' });
  }

  try {
    // 2. Deduplicate Webhook Event
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id, processed')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ID ${eventId} has already been registered in webhook logs.`);
      if (existingEvent.processed) {
        return res.status(200).json({ status: 'already_processed', message: 'Webhook deduplicated successfully.' });
      }
    } else {
      // Create trace event
      await supabase.from('webhook_events').insert({
        event_id: eventId,
        event_type: eventType,
        heygen_video_translation_id: translationId,
        raw_payload: payload,
        processed: false
      });
    }

    // 3. Update Project Translation Details
    let status = 'running';
    if (eventData.status === 'queued') status = 'pending';
    if (eventData.status === 'in progress') status = 'running';
    if (eventData.status === 'completed') status = 'completed';
    if (eventData.status === 'failed') status = 'failed';

    const { data: translationRecord, error: updateErr } = await supabase
      .from('project_translations')
      .update({
        status,
        video_url: eventData.video_url || null,
        thumbnail_url: eventData.thumbnail_url || null,
        duration: eventData.duration || null,
        failure_code: eventData.failure_code || null,
        failure_message: eventData.failure_message || null,
        callback_payload: payload
      })
      .eq('heygen_video_translation_id', translationId)
      .select('project_id, user_id')
      .maybeSingle();

    if (updateErr) {
      console.error(`Failed to update project translation matching ${translationId}:`, updateErr.message);
      throw updateErr;
    }

    // 4. If translation was found and updated, recalculate the aggregate project status
    if (translationRecord && translationRecord.project_id) {
      await updateParentProjectStatus(translationRecord.project_id);

      // Refund credits if this translation failed
      if (status === 'failed') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits_balance')
          .eq('id', translationRecord.user_id)
          .single();

        if (profile) {
          // Refund 10 (speed) or 20 (precision) credits
          // For safety, let's query the project engine mode
          const { data: project } = await supabase
            .from('projects')
            .select('mode')
            .eq('id', translationRecord.project_id)
            .single();

          const refundAmount = project?.mode === 'precision' ? 20 : 10;
          const newBalance = profile.credits_balance + refundAmount;
          
          await supabase
            .from('profiles')
            .update({ credits_balance: newBalance })
            .eq('id', translationRecord.user_id);

          await supabase.from('usage_logs').insert({
            user_id: translationRecord.user_id,
            project_id: translationRecord.project_id,
            action: 'refund_failed_translation',
            credits_used: -refundAmount,
            metadata: { refundAmount, heygen_video_translation_id: translationId }
          });

          console.log(`Successfully refunded ${refundAmount} credits to user ${translationRecord.user_id} due to failed job.`);
        }
      }
    }

    // 5. Mark webhook event as processed
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('event_id', eventId);

    return res.status(200).json({ status: 'success', message: 'Webhook processed.' });

  } catch (error: any) {
    console.error('Error processing HeyGen Webhook:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe Checkout Integration and subscription upgrades
 */
router.post('/stripe', async (req: Request, res: Response) => {
  // Production webhook handling requires signature checks using:
  // const sig = req.headers['stripe-signature'];
  // But for simple sandbox and proof-of-concept development, we parse payload values.
  const event = req.body;

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      
      // Fetch user profile matching checkout email
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', customerEmail)
        .maybeSingle();

      if (profile) {
        // Map price/product ID to plans
        // In a real app we parse price IDs, here we offer simple placeholder simulation
        let newPlan = 'starter';
        let additionalCredits = 30;

        const metadataPlan = session.metadata?.plan;
        if (metadataPlan === 'creator') {
          newPlan = 'creator';
          additionalCredits = 150;
        } else if (metadataPlan === 'agency') {
          newPlan = 'agency';
          additionalCredits = 500;
        }

        // Top up user's plan and credits
        const finalBalance = profile.credits_balance + additionalCredits;
        await supabase
          .from('profiles')
          .update({
            plan: newPlan,
            credits_balance: finalBalance
          })
          .eq('id', profile.id);

        await supabase.from('usage_logs').insert({
          user_id: profile.id,
          action: 'stripe_subscription_topup',
          credits_used: -additionalCredits, // Negative implies credits added
          metadata: { newPlan, session_id: session.id }
        });

        console.log(`Stripe subscription purchased: ${customerEmail} updated to plan ${newPlan}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe Webhook:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
