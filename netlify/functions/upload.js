const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.secret !== process.env.ADMIN_SECRET) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const store = getStore('ggt-data');

    if (body.products) {
      await store.setJSON('products', body.products);
    }

    if (body.images) {
      const codes = Object.keys(body.images);
      for (const code of codes) {
        await store.set('img_' + code, body.images[code]);
      }
      await store.setJSON('image_codes', codes);
    }

    if (body.eventInfo) await store.setJSON('event_info', body.eventInfo);
    if (body.heroTexts) await store.setJSON('hero_texts', body.heroTexts);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
