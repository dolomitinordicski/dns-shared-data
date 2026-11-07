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

/** Maximum time to wait for any individual print asset before failing safely. */
export const DNS_PRINT_ASSET_TIMEOUT_MS = 8000;

async function withinPrintTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('print-asset-timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function preflightDNSPrintAssets(
  sheet: HTMLElement | null,
  timeoutMs = DNS_PRINT_ASSET_TIMEOUT_MS,
): Promise<DNSPrintPreflightResult> {
  const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DNS_PRINT_ASSET_TIMEOUT_MS;
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
      await withinPrintTimeout(documentRoot.fonts.ready, effectiveTimeoutMs);
    } catch {
      errors.push('print-fonts-not-ready');
    }
  }

  for (const image of images) {
    if (!image.getAttribute('src')) {
      errors.push('print-image-source-missing');
      continue;
    }
    let decodeFailed = false;
    try {
      if (typeof image.decode === 'function') {
        await withinPrintTimeout(image.decode(), effectiveTimeoutMs);
      } else if (!image.complete || image.naturalWidth === 0) {
        errors.push('print-image-not-ready');
      }
    } catch {
      decodeFailed = true;
      errors.push('print-image-load-failed');
    }
    if (image.naturalWidth === 0 && !decodeFailed) errors.push('print-image-empty');
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
