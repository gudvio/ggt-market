
const { getStore } = require('@netlify/blobs');
const XLSX = require('xlsx');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const secret = body.secret || '';
    if (secret !== process.env.ADMIN_SECRET) {
      return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const store = getStore({ name: 'ggt-data', consistency: 'strong' });

    // Save products JSON
    if (body.products && Array.isArray(body.products)) {
      await store.set('products', JSON.stringify(body.products));
    }

    // Save images — each image separately by product code
    if (body.images && typeof body.images === 'object') {
      const codes = Object.keys(body.images);
      await Promise.all(codes.map(code =>
        store.set('img_' + code, body.images[code])
      ));
      // Save list of image codes
      await store.set('image_codes', JSON.stringify(codes));
    }

    // Save event info
    if (body.eventInfo) {
      await store.set('event_info', JSON.stringify(body.eventInfo));
    }

    // Save hero texts
    if (body.heroTexts) {
      await store.set('hero_texts', JSON.stringify(body.heroTexts));
    }

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message })
    };
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
