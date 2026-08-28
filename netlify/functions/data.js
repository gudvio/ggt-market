const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const store = getStore('ggt-data');
    const params = event.queryStringParameters || {};

    if (params.what === 'image') {
      const img = await store.get('img_' + params.code);
      if (!img) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ img }) };
    }

    const [products, eventInfo, heroTexts, imageCodes] = await Promise.all([
      store.get('products', { type: 'json' }).catch(() => null),
      store.get('event_info', { type: 'json' }).catch(() => null),
      store.get('hero_texts', { type: 'json' }).catch(() => null),
      store.get('image_codes', { type: 'json' }).catch(() => null),
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ products, eventInfo, heroTexts, imageCodes: imageCodes || [] })
    };
  } catch (err) {
    console.error('Data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
