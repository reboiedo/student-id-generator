import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    console.log('Proxy API called with URL:', imageUrl);
    
    if (!imageUrl) {
      console.log('No URL parameter provided');
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from expected domains
    const allowedDomains = ['student-admin.harbour.space', 'digitaloceanspaces.com'];
    const isAllowedDomain = allowedDomains.some(domain => imageUrl.includes(domain));
    
    if (!isAllowedDomain) {
      console.log('Invalid domain:', imageUrl);
      return NextResponse.json({ error: 'Invalid image URL domain' }, { status: 403 });
    }

    console.log('Fetching image from:', imageUrl);
    
    // Prepare headers - only add API token for harbour.space URLs
    const headers: HeadersInit = {
      'User-Agent': 'Student-ID-Generator/1.0',
    };
    
    if (imageUrl.includes('student-admin.harbour.space')) {
      headers['Access-Token'] = process.env.NEXT_PUBLIC_API_TOKEN || '';
      console.log('Adding API token for harbour.space URL');
    }
    
    // Fetch the image with CORS headers
    const response = await fetch(imageUrl, { 
      headers,
      mode: 'cors'
    });

    console.log('Fetch response status:', response.status, response.statusText);

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log('Successfully fetched image, content-type:', contentType, 'size:', arrayBuffer.byteLength);

    // Return the original image without processing
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in proxy-image API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}