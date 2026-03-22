import html2canvas from 'html2canvas';

/**
 * Renders HTML content to an image blob.
 * Uses the same proven pattern as ShipmentTagModal which works correctly.
 * Creates a temporary hidden div, renders with html2canvas, then cleans up.
 */
export async function renderHtmlToBlob(htmlContent: string): Promise<Blob> {
  // Create temporary hidden render container — exact same pattern as ShipmentTagModal
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;z-index:-100;opacity:0;pointer-events:none;';
  
  const renderDiv = document.createElement('div');
  renderDiv.style.cssText = 'width:794px;min-height:1123px;background:white;padding:0;margin:0;box-sizing:border-box;';
  renderDiv.innerHTML = htmlContent;
  
  wrapper.appendChild(renderDiv);
  document.body.appendChild(wrapper);

  try {
    // Wait for fonts (Sarabun is pre-loaded in index.html)
    await document.fonts.ready;
    
    // Wait for images
    const images = Array.from(renderDiv.querySelectorAll('img'));
    await Promise.allSettled(images.map(img =>
      img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => { img.style.display = 'none'; resolve(); };
        setTimeout(resolve, 3000);
      })
    ));

    // Settle time for layout
    await new Promise(r => setTimeout(r, 200));

    // Use exact same html2canvas call as ShipmentTagModal (line 380)
    const canvas = await html2canvas(renderDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      height: 1123,
      windowWidth: 1200
    });

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
    );

    return blob;
  } finally {
    document.body.removeChild(wrapper);
  }
}
