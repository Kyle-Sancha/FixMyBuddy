import assert from 'node:assert/strict';
import { MAX_ATTACHMENTS, PHOTO_LIMIT, VIDEO_LIMIT, validateAttachment } from './attachmentValidation.js';

assert.equal(MAX_ATTACHMENTS, 10);
for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']) {
  assert.equal(validateAttachment({ type, size: PHOTO_LIMIT }), '');
  assert.match(validateAttachment({ type, size: PHOTO_LIMIT + 1 }), /20 MB/);
}
for (const type of ['video/mp4', 'video/webm', 'video/quicktime']) {
  assert.equal(validateAttachment({ type, size: VIDEO_LIMIT }), '');
  assert.match(validateAttachment({ type, size: VIDEO_LIMIT + 1 }), /100 MB/);
}
assert.match(validateAttachment({ type: 'image/jpeg', size: 0 }), /empty/);
assert.match(validateAttachment({ type: 'text/html', size: 100 }), /supported/);
assert.match(validateAttachment({ type: '', size: 100 }), /supported/);
console.log('Attachment type and size boundary checks passed.');
