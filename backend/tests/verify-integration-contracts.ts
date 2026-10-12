import assert from 'assert';
import http from 'http';
import { app } from '../src/server.js';
import { prisma } from '../src/db/prisma.js';
import sharp from 'sharp';

async function runIntegrationVerification() {
  console.log('=======================================================');
  console.log('🚀 PIXEL PRIZE: FULLSTACK INTEGRATION CONTRACTS VERIFICATION');
  console.log('=======================================================\n');

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Verification test server running on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // 1. Health Check
    // -------------------------------------------------------------------------
    console.log('--- 1. Health Check Contract ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check returns HTTP 200');
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'healthy', 'Health status is healthy');
    console.log('  ✅ PASS: Health check endpoint conforms');

    // -------------------------------------------------------------------------
    // 2. Auth Flow: Registration & Login
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Auth Flow: Register, Login, GetMe ---');
    const testEmail = `test_artist_${Date.now()}@pixelprize.org`;
    const testUsername = `artist_${Date.now().toString(36)}`;

    // Register
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: testUsername,
        password: 'Password123!',
        name: 'Test Artist',
        role: 'PARTICIPANT',
      }),
    });
    assert.strictEqual(regRes.status, 201, 'Register returns HTTP 201 Created');
    const regData = await regRes.json();
    assert(Boolean(regData.token), 'Register returns JWT token');
    assert.strictEqual(regData.user.email, testEmail, 'User email matches');
    const participantToken = regData.token;
    console.log('  ✅ PASS: Participant registration succeeded');

    // Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(loginRes.status, 200, 'Login returns HTTP 200 OK');
    const loginData = await loginRes.json();
    assert(Boolean(loginData.token), 'Login returns JWT token');
    console.log('  ✅ PASS: Login returned valid session token');

    // Get Current User (/me)
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    assert.strictEqual(meRes.status, 200, 'GetMe returns HTTP 200 OK');
    const meData = await meRes.json();
    assert.strictEqual(meData.user.username, testUsername, 'Authenticated user matches');
    console.log('  ✅ PASS: Bearer token authenticated session on /api/auth/me');

    // -------------------------------------------------------------------------
    // 3. Competitions Directory & Details
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Competitions Contracts ---');
    const compsRes = await fetch(`${baseUrl}/api/competitions`);
    assert.strictEqual(compsRes.status, 200, 'List competitions returns HTTP 200');
    const compsJson = await compsRes.json();
    assert(Array.isArray(compsJson.data), 'Competitions returned inside data array');
    assert(compsJson.data.length > 0, 'Found seeded competitions in database');
    const targetComp = compsJson.data[0];
    console.log(`  ✅ PASS: Competitions listing retrieved (${compsJson.data.length} salons found)`);

    const singleCompRes = await fetch(`${baseUrl}/api/competitions/${targetComp.id}`);
    assert.strictEqual(singleCompRes.status, 200, 'Get competition by ID returns HTTP 200');
    const singleComp = await singleCompRes.json();
    assert.strictEqual(singleComp.id, targetComp.id, 'Competition ID matches');
    console.log(`  ✅ PASS: Competition details retrieved for '${singleComp.title}'`);

    // -------------------------------------------------------------------------
    // 4. File Upload & Submissions Pipeline
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Direct Upload & Submissions Pipeline ---');
    const presignedRes = await fetch(`${baseUrl}/api/submissions/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${participantToken}`,
      },
      body: JSON.stringify({
        competitionId: targetComp.id,
        filename: 'sunset_zen.jpg',
        fileSizeBytes: 1024 * 50,
        mimeType: 'image/jpeg',
      }),
    });
    assert.strictEqual(presignedRes.status, 200, 'Presigned URL returns HTTP 200');
    const presignedData = await presignedRes.json();
    assert(Boolean(presignedData.uploadUrl), 'Presigned URL returned');
    assert(Boolean(presignedData.storageKey), 'Storage key returned');
    assert(Boolean(presignedData.submissionId), 'Submission ID allocated');
    console.log('  ✅ PASS: Presigned upload URL generated');

    // Perform direct binary upload to local storage receiver (adjust port if ephemeral)
    const effectiveUploadUrl = presignedData.uploadUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
    const testImageBuffer = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: { r: 10, g: 20, b: 40 } },
    }).jpeg().toBuffer();

    const uploadRes = await fetch(effectiveUploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: testImageBuffer,
    });
    assert.strictEqual(uploadRes.status, 200, 'Local binary upload receiver returned HTTP 200');
    console.log('  ✅ PASS: Raw image binary streamed cleanly to storage endpoint');

    // Confirm submission
    const confirmRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${participantToken}`,
      },
      body: JSON.stringify({
        submissionId: presignedData.submissionId,
        competitionId: targetComp.id,
        categoryId: targetComp.categories[0].id,
        title: 'Zen Sunset over Obsidian Shores',
        story: 'Captured at dusk with long exposure.',
        storageKey: presignedData.storageKey,
      }),
    });
    assert.strictEqual(confirmRes.status, 202, 'Confirm submission returns HTTP 202 Accepted');
    const confirmData = await confirmRes.json();
    assert.strictEqual(confirmData.status, 'IN_QUEUE', 'Submission enqueued for AI judging');
    console.log('  ✅ PASS: Submission confirmed and scheduled for background AI grading');

    // Inspect individual submission
    const getSubRes = await fetch(`${baseUrl}/api/submissions/${presignedData.submissionId}`);
    assert.strictEqual(getSubRes.status, 200, 'Get submission returns HTTP 200');
    const subRecord = await getSubRes.json();
    assert.strictEqual(subRecord.title, 'Zen Sunset over Obsidian Shores', 'Submission title matches');
    console.log('  ✅ PASS: Submission record retrieved via public endpoint');

    // -------------------------------------------------------------------------
    // 5. Creator Dashboard My Submissions
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Creator Dashboard My Submissions ---');
    const mySubsRes = await fetch(`${baseUrl}/api/submissions/my`, {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    assert.strictEqual(mySubsRes.status, 200, 'My submissions returns HTTP 200');
    const mySubs = await mySubsRes.json();
    assert(Array.isArray(mySubs), 'My submissions is an array');
    assert(mySubs.some((s: any) => s.id === presignedData.submissionId), 'Created submission present in user portfolio');
    console.log(`  ✅ PASS: Creator vault successfully retrieved ${mySubs.length} submission(s)`);

    // -------------------------------------------------------------------------
    // 6. Community Upvoting
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Community Upvoting Contract ---');
    const voteRes = await fetch(`${baseUrl}/api/submissions/${presignedData.submissionId}/vote`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    assert.strictEqual(voteRes.status, 200, 'Vote endpoint returns HTTP 200');
    const voteData = await voteRes.json();
    assert.strictEqual(voteData.hasVoted, true, 'Upvote recorded');
    assert.strictEqual(voteData.newVoteCount, 1, 'Vote count incremented to 1');
    console.log('  ✅ PASS: Community upvote recorded and counter incremented');

    // -------------------------------------------------------------------------
    // 7. Appeals Docket Contract
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Appeals Filing Contract ---');
    // First, flag submission as disqualified so appeal is eligible
    await prisma.submission.update({
      where: { id: presignedData.submissionId },
      data: { status: 'FLAGGED_DISQUALIFIED', disqualificationReason: 'Test synthetic anomaly' },
    });

    const appealRes = await fetch(`${baseUrl}/api/appeals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${participantToken}`,
      },
      body: JSON.stringify({
        submissionId: presignedData.submissionId,
        reason: 'Authentic RAW file available from camera sensor with genuine PRNU noise pattern.',
      }),
    });
    assert.strictEqual(appealRes.status, 201, 'Filing appeal returns HTTP 201 Created');
    const appealData = await appealRes.json();
    assert.strictEqual(appealData.status, 'PENDING', 'Appeal status is PENDING');
    console.log('  ✅ PASS: Disqualification appeal docket created');

    // -------------------------------------------------------------------------
    // 8. Leaderboard Dual-Track Contract
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Leaderboard Dual-Track Contract ---');
    const leadRes = await fetch(`${baseUrl}/api/competitions/${targetComp.id}/leaderboard`);
    assert.strictEqual(leadRes.status, 200, 'Leaderboard returns HTTP 200');
    const leadData = await leadRes.json();
    assert(Boolean(leadData.officialTrack), 'officialTrack present in leaderboard response');
    assert(Boolean(leadData.communityTrack), 'communityTrack present in leaderboard response');
    console.log('  ✅ PASS: Dual-track leaderboard contracts match frontend specifications');

    // -------------------------------------------------------------------------
    // 9. AI Lab Scoring Sandbox Endpoint Contract
    // -------------------------------------------------------------------------
    console.log('\n--- 9. AI Lab Scoring Sandbox Endpoint Contract ---');
    const sandboxBuf = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 50, g: 120, b: 200 } },
    }).jpeg().toBuffer();
    const sandboxBase64 = `data:image/jpeg;base64,${sandboxBuf.toString('base64')}`;

    const sandboxRes = await fetch(`${baseUrl}/api/judge/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: [
          {
            id: 'sandbox_test_01',
            name: 'Sunset over Archipelago',
            dataUrl: sandboxBase64,
            categoryCode: 'LANDSCAPE',
          },
        ],
      }),
    });
    assert.strictEqual(sandboxRes.status, 200, 'Sandbox evaluation returns HTTP 200');
    const sandboxData = await sandboxRes.json();
    assert.strictEqual(sandboxData.success, true, 'Sandbox success flag is true');
    assert.strictEqual(sandboxData.count, 1, 'Evaluated count is 1');
    const evalItem = sandboxData.results[0];
    assert(typeof evalItem.overallScore === 'number', 'overallScore is a number');
    assert(typeof evalItem.themeAdherenceScore === 'number', 'themeAdherenceScore is a number');
    assert(typeof evalItem.attributeScores.composition === 'number', 'composition score is a number');
    assert(Boolean(evalItem.critique.strengths), 'critique strengths exists');
    assert(typeof evalItem.forensicsSummary.isLikelyAuthenticPhoto === 'boolean', 'forensic status exists');
    console.log(`  ✅ PASS: Sandbox evaluation completed (Score: ${evalItem.overallScore}, Latency: ${evalItem.latencyMs}ms, Model: ${evalItem.modelVersion})`);

    console.log('\n=======================================================');
    console.log('🎯 ALL 9 FULLSTACK INTEGRATION CONTRACTS VERIFIED (100% PASS)');
    console.log('=======================================================');
  } finally {
    server.close();
  }
}

runIntegrationVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fullstack integration verification failed:', err);
    process.exit(1);
  });
