import html2canvas from 'html2canvas';

/**
 * CSS that undoes Tailwind CDN's preflight resets.
 * These rules use the universal selector (*) with specificity 0,0,0.
 * They appear AFTER Tailwind's preflight (in source order) so they override it.
 * But the document's own CSS uses class selectors (specificity 0,1,0+) so the
 * document's styles still win for elements that have explicit border/display rules.
 */
const TAILWIND_UNDO_CSS = `<style>
/* Undo Tailwind preflight - restore browser defaults */
*, *::before, *::after {
  border-style: none;
  border-width: 0;
  border-color: initial;
}
img, svg, video, canvas { display: inline; vertical-align: baseline; }
h1, h2, h3, h4, h5, h6 { font-size: revert; font-weight: revert; }
ol, ul { list-style: revert; padding: revert; }
a { color: revert; text-decoration: revert; }
table { border-collapse: revert; }
</style>`;

/**
 * Renders HTML content to an image blob.
 * Uses the same proven pattern as ShipmentTagModal (hidden div + html2canvas).
 * Injects CSS overrides to undo Tailwind CDN interference before the document HTML.
 */
export async function renderHtmlToBlob(htmlContent: string): Promise<Blob> {
  // Create temporary hidden render container
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;z-index:-100;opacity:0;pointer-events:none;';
  
  const renderDiv = document.createElement('div');
  renderDiv.style.cssText = 'width:794px;min-height:1123px;background:white;padding:0;margin:0;box-sizing:border-box;';
  // Inject Tailwind-undo CSS BEFORE the document HTML.
  // Order: Tailwind preflight (head) → our reset (body, same specificity, wins) → document CSS (body, higher specificity, wins)
  renderDiv.innerHTML = TAILWIND_UNDO_CSS + htmlContent;
  
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

    // html2canvas — same options as ShipmentTagModal
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
