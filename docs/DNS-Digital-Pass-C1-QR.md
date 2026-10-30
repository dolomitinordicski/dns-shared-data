# Digital Pass C1: deterministic renderer QR acceptance

The post-merge run 41058118912 (job 124070687942, commit 94fcd1e) passed disabled registration and scenarios 01-03, then failed scenario 04 while ZXing located the generated PNG. Fixture source: artifact 12976789795; PNG SHA-256 3ff21ae6d05859c664965a903427e3aa20bd53c15fcfd6e2364558b14258cd7a. Its token/URL belongs only to demo-dns-core on loopback.

The PNG is a valid version 6, 41-module QR with mask 2 and four-module margin. The exact same image decodes to the original URL through ZXing PURE_BARCODE. Re-rendering the recovered URL at the original settings reproduced the PNG locally. Finder instrumentation in ZXing 0.21.3 found genuine centers (65,65), (356,65), (65,356), but selected the lower-left plus two false positives (171.5,305) and (334.5,356). The count-based candidate ranking discarded the upper genuine centers. GridSampler then rejected points outside the image; MultiFormatReader swallowed the NotFoundException and returned its generic detection error. QR_ONLY and TRY_HARDER also fail on this fixture.

An offline deterministic 200-payload experiment produced 20 default-detector failures at 420 px, 11 at integer scale 8, and zero with PURE_BARCODE. Changing dimensions therefore is not the fix. Random runtime tokens vary the QR data/mask and expose this decoder scene-finder limitation. There is no evidence here of an invalid QR encoding, bad PNG, broken registration or application regression; this does not prove real-camera performance.

The minimal correction explicitly selects PURE_BARCODE for a monochrome, unrotated, unskewed renderer output, the documented input contract of that ZXing mode. PNG generation stays at width 420/margin 4. The decoder still samples image modules, decodes format/codewords and performs QR error correction; its output must equal the URL recovered from the actual HTTP pass response. There is one decode, no retry/fallback, no expected-payload shortcut, and no skipped E2E scenario. Production QR generation/validation is unchanged. Camera/perspective detector acceptance remains a separate staging/device test.

Regression tests preserve the original PNG, decode it 32 times, verify 1024 deterministic payload/mask combinations including longer staging-shaped URLs, and reject a blank PNG. CI runs three independent full Auth/Functions/Firestore E2E jobs, each with both flag states. These are planned repetitions; every failure remains a failed job.

Reproduce using Node 22/Java 21:

```sh
npm install --ignore-scripts --no-package-lock
npm install --prefix server --ignore-scripts --no-package-lock
npm install --prefix tools/digital-pass-e2e --ignore-scripts --no-package-lock
node --test tests/qr/digital-pass-rendered-qr.test.mjs
npm run build:package
npm run typecheck
node --test tests/digital-pass-*.test.mjs
npm run test:digital-pass:e2e
npm run test:digital-pass:e2e
npm run test:digital-pass:e2e
```

Use only demo projects and synthetic fixtures. No merge, Firebase deploy, Rules/IAM/secret change, real email, real inventory or production activation is authorized by these tests.

The local ZXing source documents PURE_BARCODE in core/qrcode/QRCodeReader: it extracts bits from a pure monochrome unrotated/unskewed image, then uses the regular QR codeword decoder. See https://github.com/zxing-js/library/blob/v0.21.3/src/core/qrcode/QRCodeReader.ts .
