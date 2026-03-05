

## Plan: Support GIF and SVG uploads

Currently all image uploads go through `compressImage` which converts everything to JPEG via canvas. GIFs lose animation and SVGs get rasterized. The fix is to skip compression for GIF/SVG files and upload them as-is with their original content type and extension.

### Changes

#### 1. `src/lib/imageUtils.ts` — add helper to detect non-compressible formats

Add a utility function `shouldSkipCompression(file: File): boolean` that returns `true` for `image/gif`, `image/svg+xml`, and files with `.gif`/`.svg` extensions.

#### 2. `src/components/protocols/ProtocolPhotosUploader.tsx` — skip compression for GIF/SVG

In `handleFileSelect`, before calling `compressImage`:
- Check file type; if GIF or SVG, upload the original file directly (no canvas compression)
- Use the original file's content type (`image/gif`, `image/svg+xml`) instead of hardcoded `image/jpeg`
- Use appropriate file extension (`.gif`, `.svg`) in the generated filename instead of `.jpg`
- Update `accept` attribute to explicitly include `image/*` (already covers GIF/SVG, no change needed)

#### 3. `src/components/admin/ReservationPhotosDialog.tsx` — same skip-compression logic

Apply the same pattern: check file type before compressing, preserve original content type and extension for GIF/SVG.

#### 4. `src/components/protocols/DamagePointDrawer.tsx` — same pattern

Has its own inline `compressImage`. Apply same skip logic for GIF/SVG files.

### Technical detail

For each upload point, the pattern is:
```typescript
const isGifOrSvg = file.type === 'image/gif' || file.type === 'image/svg+xml';
const blob = isGifOrSvg ? file : await compressImage(file);
const ext = file.type === 'image/gif' ? '.gif' : file.type === 'image/svg+xml' ? '.svg' : '.jpg';
const contentType = isGifOrSvg ? file.type : 'image/jpeg';
```

No database or storage bucket changes needed — existing buckets already accept any file type.

