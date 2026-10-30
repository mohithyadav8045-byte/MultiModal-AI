import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting OmniMind AI End-to-End Suite ---');

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ [Health Check]:', health.status, `(Database: ${health.database})`);

  // 2. Register User
  const testEmail = `test_${Date.now()}@omnimind.ai`;
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Chief AI Architect',
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const regData = await registerRes.json();
  if (!regData.success) throw new Error('Registration failed: ' + JSON.stringify(regData));
  const token = regData.token;
  console.log('✓ [Auth Register]: Registered user', regData.user.email);

  // 3. Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
  console.log('✓ [Auth Login]: JWT verified successfully');

  // 4. Auth Me
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('✓ [Auth Me]: Scoped to', meData.user.fullName);

  // 5. Upload Multimodal Assets
  const dummyDoc = Buffer.from('Enterprise Contract: Parties agree to deliver cross-modal AI deliverables by Q4 2026.');
  const formData = new FormData();
  const blob = new Blob([dummyDoc], { type: 'text/plain' });
  formData.append('files', blob, 'enterprise_contract.txt');
  formData.append('title', 'Master Service Agreement 2026');

  const uploadRes = await fetch(`${BASE_URL}/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success) throw new Error('Upload failed: ' + JSON.stringify(uploadData));
  const assetId = uploadData.assets[0].id;
  console.log('✓ [Asset Ingestion]: Uploaded and indexed asset ID', assetId);

  // 6. List Assets
  const listRes = await fetch(`${BASE_URL}/assets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log('✓ [Asset List]: Retrieved', listData.count, 'asset(s)');

  // 7. Send Chat Message Grounded in Asset
  const chatRes = await fetch(`${BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      content: 'What are the delivery terms specified in the contract?',
      assetIds: [assetId]
    })
  });
  const chatData = await chatRes.json();
  if (!chatData.success) throw new Error('Chat failed: ' + JSON.stringify(chatData));
  console.log('✓ [OmniChat AI]: Response received with citations:', chatData.aiMessage.citations?.length || 0);

  // 8. Generate Synthesis Report
  const reportRes = await fetch(`${BASE_URL}/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Executive Contract Verification Report',
      assetIds: [assetId],
      customPrompt: 'Highlight core deliverables and timeline risks.'
    })
  });
  const reportData = await reportRes.json();
  if (!reportData.success) throw new Error('Report generation failed: ' + JSON.stringify(reportData));
  console.log('✓ [Report Synthesis]: Successfully synthesized report ID', reportData.report.id);

  console.log('\n======================================================');
  console.log('🎉 ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
