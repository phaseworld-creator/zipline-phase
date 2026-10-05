# Upload Multipart Boundary Fix

## Problem
Users were experiencing "no multipart boundary" errors when uploading files. This error occurs when the `Content-Type: multipart/form-data` header is set manually without the correct boundary parameter, or when the boundary in the header doesn't match the actual boundary used in the request body.

## Root Cause
The issue was found in the script generators that create curl commands for uploading files. These generators were incorrectly adding `-H 'content-type: multipart/form-data'` when using curl's `-F` flag.

## Why This Breaks Uploads
When you use:
- `FormData` in browser JavaScript
- `curl -F` in shell scripts
- Any multipart form upload tool

The tool **automatically** generates:
1. A unique boundary string (e.g., `----WebKitFormBoundary...`)
2. The correct `Content-Type` header with that boundary

If you manually set the `Content-Type` header:
- You either provide no boundary → Server error: "no multipart boundary"
- You provide a wrong boundary → Server can't parse the data

## Files Fixed

### 1. `src/components/pages/settings/parts/SettingsGenerators/generators/shell.tsx`
**Before:**
```typescript
if (type === 'file') {
  curl.push('-F', '"file=@$1;type=$(file --mime-type -b "$1")"');
  curl.push('-H', "'content-type: multipart/form-data'");  // ❌ WRONG
}
```

**After:**
```typescript
if (type === 'file') {
  curl.push('-F', '"file=@$1;type=$(file --mime-type -b "$1")"');
  // Content-Type is automatically set by curl when using -F flag
}
```

### 2. `src/components/pages/settings/parts/SettingsGenerators/generators/flameshot.tsx`
**Before:**
```typescript
if (type === 'file') {
  curl.push('-F', 'file=@/tmp/screenshot.png');
  curl.push('-H', "'content-type: multipart/form-data'");  // ❌ WRONG
}
```

**After:**
```typescript
if (type === 'file') {
  curl.push('-F', 'file=@/tmp/screenshot.png');
  // Content-Type is automatically set by curl when using -F flag
}
```

### 3. `src/server/routes/api/upload/index.ts`
Enhanced error logging to make debugging easier:
- Changed log level from `warn` to `error`
- Added more context (stack trace, headers, URL)
- Better error messages for multipart parsing failures

### 4. `src/server/startup/plugins.ts`
Added explicit multipart configuration options for better compatibility:
```typescript
await server.register(fastifyMultipart, {
  limits: {
    fileSize: bytes(config.files.maxFileSize),
    parts: config.files.maxFilesPerUpload,
  },
  attachFieldsToBody: false,
  sharedSchemaId: 'MultipartFileType',
});
```

## How to Test

### Browser Upload
1. Go to `/dashboard/upload/file`
2. Drag and drop files or click to select
3. Click Upload
4. Should work without errors

### Generated Scripts
1. Go to Settings → Generators
2. Download shell script or flameshot script
3. Run the script with a file
4. Should upload successfully

### Manual curl Test
```bash
# ✅ CORRECT - Let curl set Content-Type automatically
curl -H "authorization: YOUR_TOKEN" \
  -F "file=@test.png" \
  http://your-zipline-instance.com/api/upload

# ❌ WRONG - Don't do this
curl -H "authorization: YOUR_TOKEN" \
  -H "content-type: multipart/form-data" \
  -F "file=@test.png" \
  http://your-zipline-instance.com/api/upload
```

## Key Takeaways

1. **Never** manually set `Content-Type: multipart/form-data` when using:
   - `FormData` in JavaScript
   - `curl -F` in shell scripts
   - Any tool that handles multipart uploads

2. **Always** let the tool set the Content-Type automatically with the correct boundary

3. The browser/curl automatically generates a unique boundary and includes it in the header

## Additional Notes

The existing frontend code (`src/lib/client/upload/files.tsx`) was already correct and didn't set Content-Type manually. The issue only affected users who were using the generated shell scripts or testing with manually crafted curl commands.
