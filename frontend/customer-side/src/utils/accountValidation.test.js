import assert from 'node:assert/strict';
import { safeSupportContact, validDispute, validSupportMessage } from './accountValidation.js';
import { filipino, setActiveLanguage, tr, trTemplate } from '../i18n/translations.js';

assert.equal(validSupportMessage({ id: 'id', body: 'Hello', sender: 'customer' }), true);
assert.equal(validSupportMessage({ id: '', body: 'Hello', sender: 'customer' }), false);
assert.equal(validSupportMessage({ id: 'id', body: 'Hello', sender: 'system' }), false);
assert.equal(validSupportMessage(null), false);
assert.equal(validDispute({ id: 'case', subject: 'Concern', status: 'submitted' }), true);
assert.equal(validDispute({ id: '', subject: 'Concern', status: 'submitted' }), false);
assert.equal(validDispute({ id: 'case', subject: '', status: 'submitted' }), false);
assert.deepEqual(safeSupportContact({ phone: 'javascript:alert(1)', email: 'mail@example.test\r\nBcc: x' }), { phone: '', email: '' });
assert.equal(safeSupportContact({ phone: '+63 900 000 0000', email: 'support@example.test' }).email, 'support@example.test');
setActiveLanguage('fil');
assert.equal(tr('Sign in'), 'Mag-sign in');
assert.equal(trTemplate(["We've got you, ", "."], ['Customer Name']), 'Kasama mo kami, Customer Name.');
assert.equal(tr('/request?service=towing'), '/request?service=towing');
assert.equal(tr('An actual customer message'), 'An actual customer message');
assert.ok(Object.keys(filipino).length > 300);
setActiveLanguage('en');
assert.equal(tr('Sign in'), 'Sign in');
console.log('Support record validation, contact safety and English/Filipino translation checks passed.');

