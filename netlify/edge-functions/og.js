const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export default async (request, context) => {
  const res = await context.next();
  try {
    const url = new URL(request.url);
    const slug = decodeURIComponent(url.pathname.replace(/^\/post\//, '').replace(/\/$/, ''));
    const base = Netlify.env.get('VITE_SUPABASE_URL');
    const key = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
    if (!slug || !base || !key) return res;

    const r = await fetch(
      `${base}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=title,author_name,body,image_url&limit=1`,
      { headers: { apikey: key, Authorization: 'Bearer ' + key } }
    );
    const rows = await r.json();
    const p = Array.isArray(rows) ? rows[0] : null;
    if (!p) return res;

    const title = esc(p.title + ' | वाक्-ऋचा');
       const desc = esc(p.author_name + ' — ' + p.body.replace(/\s+/g, ' ').slice(0, 110) + ' … पूरी पत्रिका पढ़ें: ' + url.host);
       const img = esc(p.image_url || (url.origin + '/og-default.jpg'));
    const tags = `<title>${title}</title>
<meta name="description" content="${desc}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="वाक्-ऋचा"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:url" content="${esc(url.href)}"/>
${img ? `<meta property="og:image" content="${img}"/>` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${desc}"/>
${img ? `<meta name="twitter:image" content="${img}"/>` : ''}`;

    let html = await res.text();
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+(?:property|name)="(?:og:[^"]*|twitter:[^"]*|description)"[^>]*>/g, '')
      .replace('</head>', tags + '</head>');

    const headers = new Headers(res.headers);
    headers.delete('content-length');
    return new Response(html, { status: res.status, headers });
  } catch (e) {
    return res;
  }
};
