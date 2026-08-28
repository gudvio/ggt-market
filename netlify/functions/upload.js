exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.secret !== process.env.ADMIN_SECRET) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Parse Netlify Blobs context from environment
    const ctx = JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT || 'e30=', 'base64').toString());
    const { edgeURL, token, siteID } = ctx;
    
    if (!edgeURL || !token) {
      return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Blobs not configured', ctx: JSON.stringify(ctx) }) };
    }

    const store = 'ggt-data';

    async function blobSet(key, value) {
      const url = `${edgeURL}/${siteID}/${store}/${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'text/plain' },
        body: typeof value === 'string' ? value : JSON.stringify(value)
      });
      if (!res.ok) throw new Error(`Blob PUT ${key}: ${res.status} ${await res.text()}`);
    }

    if (body.products) await blobSet('products', body.products);
    
    if (body.images) {
      const codes = Object.keys(body.images);
      for (const code of codes) {
        await blobSet('img_' + code, body.images[code]);
      }
      await blobSet('image_codes', codes);
    }

    if (body.eventInfo) await blobSet('event_info', body.eventInfo);
    if (body.heroTexts) await blobSet('hero_texts', body.heroTexts);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
