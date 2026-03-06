

## Plan: Unified Photo Uploader with Progress + Cancel

### New shared component: `src/components/ui/photo-uploader.tsx`

Handles multi-file upload with progress, cancel, grid UI, delete confirmation, fullscreen viewing.

**Progress UI in upload tile:**
```text
┌──────────────┐
│              │
│     30%      │  ← 22px bold
│     [X]      │  ← cancel button
└──────────────┘
```

- `uploadProgress` state: `{ current: number, total: number } | null`
- `cancelRef` checked between files in loop
- On cancel: break loop, keep already-uploaded files, toast "Przesłano X z Y zdjęć"

### Replace all 4 implementations

| File | Change |
|------|--------|
| `ProtocolPhotosUploader.tsx` | Thin wrapper importing `PhotoUploader` + `onAnnotate` for protocol auto-save |
| `ReservationPhotosDialog.tsx` | Use `PhotoUploader` inside Dialog, remove upload logic |
| `DamagePointDrawer.tsx` | Use `PhotoUploader`, remove local `compressImage` |
| `HallView.tsx` | Delegate to shared upload logic |

### Cleanup
- Remove duplicate `compressImage` from `ProtocolPhotosUploader` and `DamagePointDrawer` (use `@/lib/imageUtils`)

### Version bump to `01.27.21`

