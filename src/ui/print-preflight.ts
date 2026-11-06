/**
 * Foundation 1.4 — non-destructive print asset preflight.
 * Consumers own document content; Foundation checks readiness only.
 */
export interface DNSPrintPreflightResult {
  ready: boolean;
  errors: string[];
  warnings: string[];
  imageCount: number;
  svgCount: number;
}

export async function preflightDNSPrintAssets(
  sheet: HTMLElement | null,
): Promise<DNSPrintPreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!sheet) {
    return { ready: false, errors: ['print-sheet-missing'], warnings, imageCount: 0, svgCount: 0 };
  }

  const images = Array.from(sheet.querySelectorAll('img'));
  const svgs = Array.from(sheet.querySelectorAll('svg'));
  const documentRoot = sheet.ownerDocument;

  // Browser print can otherwise capture fallback fonts before web fonts settle.
  if (documentRoot.fonts?.ready) {
    try {
      await documentRoot.fonts.ready;
    } catch {
      warnings.push('print-fonts-unverified');
    }
  }

  for (const image of images) {
    if (!image.getAttribute('src')) {
      errors.push('print-image-source-missing');
      continue;
    }
    try {
      if (typeof image.decode === 'function') {
        await image.decode();
      } else if (!image.complete || image.naturalWidth === 0) {
        errors.push('print-image-not-ready');
      }
    } catch {
      errors.push('print-image-load-failed');
    }
    if (image.naturalWidth === 0) errors.push('print-image-empty');
  }

  for (const svg of svgs) {
    if (!svg.getAttribute('viewBox') && !svg.getAttribute('width')) {
      warnings.push('print-svg-dimensions-unverified');
    }
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    imageCount: images.length,
    svgCount: svgs.length,
  };
}
