/**
 * Image Background Remover Worker
 * Uses remove.bg API
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API endpoint
    if (url.pathname === '/remove-bg' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const imageFile = formData.get('image_file');

        if (!imageFile) {
          return new Response('No image file provided', { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
          });
        }

        // Convert to base64
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Call remove.bg API
        const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': env.REMOVE_BG_API_KEY,
          },
          body: JSON.stringify({
            image_file_b64: base64,
            size: 'auto',
          }),
        });

        if (!apiResponse.ok) {
          const errText = await apiResponse.text();
          return new Response(`Remove.bg API error: ${errText}`, { 
            status: apiResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
          });
        }

        const resultBlob = await apiResponse.blob();

        return new Response(resultBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="removed-bg.png"',
          },
        });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
