import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SCOPE = 'offline_access openid profile email User.Read Calendars.Read';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { start, end } = await req.json().catch(() => ({}));
    if (!start || !end) return json({ error: 'Missing start/end' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: tokenRow } = await admin
      .from('microsoft_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!tokenRow) return json({ connected: false, events: [] });

    let accessToken: string = tokenRow.access_token;

    // Refresh if expired (or about to expire)
    if (new Date(tokenRow.expires_at).getTime() <= Date.now() + 60_000) {
      if (!clientId || !clientSecret) {
        return json({ error: 'Microsoft credentials not configured' }, 500);
      }
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
        scope: SCOPE,
      });
      const refreshRes = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) {
        // Refresh token invalid -> require reconnect
        await admin.from('microsoft_calendar_tokens').delete().eq('user_id', user.id);
        return json({ connected: false, events: [], error: 'reconnect_required' });
      }
      accessToken = refreshData.access_token;
      await admin
        .from('microsoft_calendar_tokens')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token ?? tokenRow.refresh_token,
          expires_at: new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    const url = new URL('https://graph.microsoft.com/v1.0/me/calendarView');
    url.searchParams.set('startDateTime', start);
    url.searchParams.set('endDateTime', end);
    url.searchParams.set('$select', 'subject,start,end,isAllDay,location,bodyPreview,onlineMeeting,webLink');
    url.searchParams.set('$orderby', 'start/dateTime');
    url.searchParams.set('$top', '250');

    const graphRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });
    const graphData = await graphRes.json();
    if (!graphRes.ok) {
      return json({ connected: true, events: [], error: graphData.error?.message || 'Graph error' }, 200);
    }

    const events = (graphData.value ?? []).map((e: any) => {
      const toIso = (v: { dateTime: string } | null) =>
        v?.dateTime ? `${v.dateTime.split('.')[0]}Z` : null;
      return {
        id: e.id,
        title: e.subject || '(Sem título)',
        startAt: toIso(e.start),
        endAt: toIso(e.end),
        allDay: !!e.isAllDay,
        location: e.location?.displayName || '',
        description: e.bodyPreview || '',
        webLink: e.onlineMeeting?.joinUrl || e.webLink || '',
      };
    });

    return json({ connected: true, accountEmail: tokenRow.account_email, events });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
