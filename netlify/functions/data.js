exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  try {
    const ctx = JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT || 'e30=', 'base64').toString());
    const { edgeURL, token, siteID } = ctx;

    if (!edgeURL || !token) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ products: null, imageCodes: [], _debug: 'no blobs context' }) };
    }

    const store = 'ggt-data';
    const params = event.queryStringParameters || {};

    async function blobGet(key) {
      const url = `${edgeURL}/${siteID}/${store}/${encodeURIComponent(key)}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return null;
      const text = await res.text();
      try { return JSON.parse(text); } catch { return text; }
    }

    if (params.what === 'image') {
      const img = await blobGet('img_' + params.code);
      if (!img) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'not found' }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ img }) };
    }

    const [products, eventInfo, heroTexts, imageCodes] = await Promise.all([
      blobGet('products'),
      blobGet('event_info'),
      blobGet('hero_texts'),
      blobGet('image_codes'),
    ]);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ products, eventInfo, heroTexts, imageCodes: imageCodes || [] })
    };
  } catch (err) {
    console.error('Data error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
