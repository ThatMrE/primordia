// Donorbox calls this URL after each gift: /.netlify/functions/donorbox-webhook?token=<DONORBOX_WEBHOOK_TOKEN>
// The body is ignored. The call only starts a pull from the Donorbox API.
import { syncDonorbox, tokenMatches } from '../../scripts/donorbox.mjs';

export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!tokenMatches(token, (process.env.DONORBOX_WEBHOOK_TOKEN || '').trim())) return new Response('Forbidden', { status: 403 });
  try {
    const result = await syncDonorbox({ days: 2 });
    return Response.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    console.error(`Donorbox webhook pull failed: ${error.message}`);
    return Response.json({ ok: false }, { status: 502 });
  }
};
