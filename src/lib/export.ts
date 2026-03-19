import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export function addWatermark(svgElement: SVGElement): void {
  // Append a <text> element to the SVG at bottom-right
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", "99%");
  text.setAttribute("y", "98%");
  text.setAttribute("text-anchor", "end");
  text.setAttribute("font-size", "11px");
  text.setAttribute("fill", "rgba(100, 116, 139, 0.6)"); // Muted slate color
  text.setAttribute("font-family", "monospace");
  text.textContent = "Made with InstantERD — Free Plan";
  svgElement.appendChild(text);
}

export function exportSVG(svgElement: SVGElement, filename: string): Blob {
  const clone = svgElement.cloneNode(true) as SVGElement;
  
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(clone);
  
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${filename}.svg`);
  return blob;
}

export async function exportPNG(svgElement: HTMLElement, filename: string, isPro: boolean): Promise<Blob> {
  const clone = svgElement.cloneNode(true) as HTMLElement;
  
  if (!isPro && clone.tagName.toLowerCase() === 'svg') {
    addWatermark(clone as unknown as SVGElement);
  } else if (!isPro) {
    const svg = clone.querySelector('svg');
    if (svg) addWatermark(svg);
  }

  document.body.appendChild(clone);
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';

  try {
    const dataUrl = await toPng(clone, { pixelRatio: 2 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    triggerDownload(blob, `${filename}.png`);
    return blob;
  } finally {
    document.body.removeChild(clone);
  }
}

export async function exportPDF(svgElement: HTMLElement, filename: string, isPro: boolean): Promise<Blob> {
  const clone = svgElement.cloneNode(true) as HTMLElement;
  
  if (!isPro && clone.tagName.toLowerCase() === 'svg') {
    addWatermark(clone as unknown as SVGElement);
  } else if (!isPro) {
    const svg = clone.querySelector('svg');
    if (svg) addWatermark(svg);
  }

  document.body.appendChild(clone);
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';

  try {
    const dataUrl = await toPng(clone, { pixelRatio: 2 });
    
    // Create PDF matching the SVG dimensions
    const width = clone.offsetWidth;
    const height = clone.offsetHeight;
    
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [width, height]
    });
    
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
    const blob = pdf.output('blob');
    triggerDownload(blob, `${filename}.pdf`);
    return blob;
  } finally {
    document.body.removeChild(clone);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
