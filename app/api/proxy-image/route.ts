import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const quality = searchParams.get('quality');
    
    console.log('Proxy API called with URL:', imageUrl, 'Size:', width, 'x', height);
    
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
    
    // Fetch the image
    const response = await fetch(imageUrl, { headers });

    console.log('Fetch response status:', response.status, response.statusText);

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const originalContentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    console.log('Successfully fetched image, content-type:', originalContentType, 'size:', arrayBuffer.byteLength);

    // Convert arrayBuffer to Buffer for Sharp processing
    const buffer = Buffer.from(arrayBuffer);
    let processedBuffer = buffer;
    let contentType = originalContentType;

    // Apply image processing if size parameters are provided
    if (width || height) {
      const widthNum = width ? parseInt(width, 10) : undefined;
      const heightNum = height ? parseInt(height, 10) : undefined;
      const qualityNum = quality ? parseInt(quality, 10) : 80;

      // Validate dimensions (prevent abuse)
      if (widthNum && (widthNum > 2000 || widthNum < 1)) {
        return NextResponse.json({ error: 'Invalid width parameter' }, { status: 400 });
      }
      if (heightNum && (heightNum > 2000 || heightNum < 1)) {
        return NextResponse.json({ error: 'Invalid height parameter' }, { status: 400 });
      }

      console.log('Resizing image to:', widthNum, 'x', heightNum, 'quality:', qualityNum);

      try {
        let sharpInstance = sharp(buffer);

        // Resize the image
        if (widthNum || heightNum) {
          sharpInstance = sharpInstance.resize(widthNum, heightNum, {
            fit: 'cover', // Crop to fit dimensions
            position: 'center'
          });
        }

        // Convert to WebP for better compression and set quality
        processedBuffer = Buffer.from(await sharpInstance
          .webp({ quality: qualityNum })
          .toBuffer());

        contentType = 'image/webp';
        console.log('Image resized successfully, new size:', processedBuffer.length);
      } catch (sharpError) {
        console.error('Error processing image with Sharp:', sharpError);
        // Fall back to original image if processing fails
        processedBuffer = buffer;
        contentType = originalContentType;
      }
    }

    // Determine cache duration based on whether image was resized
    const cacheMaxAge = (width || height) ? 86400 : 3600; // 24 hours for resized, 1 hour for original

    return new NextResponse(processedBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${cacheMaxAge}`, // Longer cache for resized images
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}