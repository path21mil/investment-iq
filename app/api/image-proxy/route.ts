import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // 1. Get the requested image URL from the query string
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // 2. Fetch the image server-to-server (Bypasses browser CORS completely!)
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // 3. Convert the image into a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Send the image back to your frontend with proper headers
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'image/png');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours to save bandwidth

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}