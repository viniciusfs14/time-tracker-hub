import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SCOPE = 'offline_access openid profile email User.Read Calendars.Read';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return json({ error: 'Microsoft credentials not configured' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const { action, redirectUri, code } = body as {
      action?: string;
      redirectUri?: string;
      code?: string;
    };

    // Step 1: build the Microsoft authorization URL (client_id kept server-side)
    if (action === 'authUrl') {
      if (!redirectUri) return json({ error: 'Missing redirectUri' }, 400);
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: SCOPE,
        state: 'ms_calendar',
        prompt: 'select_account',
      });
      return json({ url: `${AUTH_URL}?${params.toString()}` });
    }

    // All other actions require an authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    // Step 2: exchange the authorization code for tokens and store them
    if (action === 'connect') {
      if (!code || !redirectUri) return json({ error: 'Missing code/redirectUri' }, 400);

      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: SCOPE,
      });
      const tokenRes = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return json({ error: tokenData.error_description || 'Token exchange failed' }, 400);
      }

      let accountEmail: string | null = null;
      try {
        const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          accountEmail = me.mail || me.userPrincipalName || null;
        }
      } catch (_) {
        // ignore
      }

      const admin = createClient(supabaseUrl, serviceKey);
      const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();
      const { error: upsertErr } = await admin
        .from('microsoft_calendar_tokens')
        .upsert(
          {
            user_id: user.id,
            account_email: accountEmail,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (upsertErr) return json({ error: upsertErr.message }, 500);

      return json({ connected: true, accountEmail });
    }

    // Disconnect
    if (action === 'disconnect') {
      const admin = createClient(supabaseUrl, serviceKey);
      await admin.from('microsoft_calendar_tokens').delete().eq('user_id', user.id);
      return json({ disconnected: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
