export async function convertImageToDataURL(imageUrl: string): Promise<string | null> {
  try {
    // Skip conversion if already a data URL or local path
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
      return imageUrl;
    }

    // Use proxy API for external images
    let fetchUrl = imageUrl;
    if (imageUrl.includes('student-admin.harbour.space') || imageUrl.includes('digitaloceanspaces.com')) {
      // Use our proxy API to bypass CORS for both API domain and DigitalOcean Spaces
      fetchUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      console.log('Using proxy URL:', fetchUrl);
    } else {
      console.log('Using direct URL:', fetchUrl);
    }

    console.log('Fetching image from:', fetchUrl);
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    return null;
  }
}

export async function convertStudentImageForPDF(photoUrl: string | undefined): Promise<string | null> {
  if (!photoUrl || photoUrl.trim() === '' || photoUrl === '/test-photo.jpg') {
    return null;
  }
  
  console.log('Converting image for PDF:', photoUrl);
  const result = await convertImageToDataURL(photoUrl);
  console.log('Image conversion result:', result ? 'success' : 'failed');
  return result;
}