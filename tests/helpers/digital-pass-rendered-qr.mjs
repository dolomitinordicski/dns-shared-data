/** Decode an axis-aligned monochrome renderer output, not a camera photograph.
 * PURE_BARCODE still samples the PNG modules and decodes/checks QR codewords;
 * it avoids the scene finder heuristic that misidentifies data as finder patterns.
 * One decode only: no retry, fallback, hard-coded payload or provider request. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(process.env.DNS_E2E_DEPS_ROOT?resolve(process.env.DNS_E2E_DEPS_ROOT,'package.json'):new URL('../../tools/digital-pass-e2e/package.json',import.meta.url));
const {PNG}=require('pngjs'),zxing=require('@zxing/library');
export function decodeRenderedQr(image){
 const png=PNG.sync.read(image),luminance=new Uint8ClampedArray(png.width*png.height);
 for(let i=0;i<luminance.length;i++)luminance[i]=(png.data[4*i]+2*png.data[4*i+1]+png.data[4*i+2])/4;
 const bitmap=new zxing.BinaryBitmap(new zxing.HybridBinarizer(new zxing.RGBLuminanceSource(luminance,png.width,png.height)));
 return new zxing.MultiFormatReader().decode(bitmap,new Map([
  [zxing.DecodeHintType.PURE_BARCODE,true],
  [zxing.DecodeHintType.POSSIBLE_FORMATS,[zxing.BarcodeFormat.QR_CODE]],
 ])).getText();
}
