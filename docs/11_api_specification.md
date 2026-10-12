# 11: REST & Internal API Specifications

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Frontend Developers, Backend Engineers, QA Engineers, AI Coding Agents  
> **Protocol:** RESTful JSON over HTTPS (TLS 1.3)  
> **Error Format Standard:** RFC 7807 Problem Details  
> **Related Documents:**  
> - [03_user_flows_and_pages.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/03_user_flows_and_pages.md)  
> - [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md)  
> - [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md)

---

## 1. Authentication & Global Headers

All mutating or protected endpoints require an authenticated session token via standard NextAuth / Bearer token headers:

```http
Authorization: Bearer <jwt_session_token>
Content-Type: application/json
Accept: application/json
```

### Standard Error Response Format (RFC 7807)
```json
{
  "type": "https://pixelprize.org/errors/quota-exceeded",
  "title": "Submission Quota Exceeded",
  "status": 403,
  "detail": "User has already submitted 2 of 2 allowed entries for competition clx89012.",
  "instance": "/api/submissions/presigned-url",
  "code": "ERR_SUBMISSION_QUOTA_EXCEEDED"
}
```

---

## 2. Competition Endpoints

### 2.1 List Competitions
- **Endpoint:** `GET /api/competitions`
- **Access:** Public
- **Query Parameters:**
  - `status`: Filter by lifecycle (`OPEN`, `JUDGING`, `RESULTS_PUBLISHED`, `ARCHIVED`).
  - `category`: Category code (e.g., `STREET`, `LANDSCAPE`).
  - `page`: Page index (default: 1).
  - `limit`: Page size (default: 12, max: 50).

#### Response (`200 OK`)
```json
{
  "data": [
    {
      "id": "comp_clx001",
      "title": "Urban Monochromes: Street Life in B&W",
      "slug": "urban-monochromes-2026",
      "status": "OPEN",
      "bannerUrl": "https://media.pixelprize.org/banners/urban-mono.webp",
      "prizeSummary": "$2,500 Cash Purse + Leica Q3 Feature",
      "submissionEndDate": "2026-11-15T23:59:59Z",
      "resultsPublishDate": "2026-11-20T18:00:00Z",
      "maxEntriesPerUser": 2,
      "categories": [
        { "code": "STREET", "name": "Street Photography" },
        { "code": "MONOCHROME", "name": "Monochrome & Tonal" }
      ],
      "metrics": {
        "totalSubmissions": 482,
        "daysRemaining": 14
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalCount": 28,
    "totalPages": 3
  }
}
```

---

### 2.2 Create Competition
- **Endpoint:** `POST /api/competitions`
- **Access:** Organizer / Admin
- **Request Body:**
```json
{
  "title": "Wildlife in Motion 2026",
  "slug": "wildlife-in-motion-2026",
  "description": "Celebrating untamed fauna through dynamic action and behavioral photography.",
  "bannerUrl": "https://media.pixelprize.org/banners/wildlife.webp",
  "submissionStartDate": "2026-11-01T00:00:00Z",
  "submissionEndDate": "2026-12-01T23:59:59Z",
  "resultsPublishDate": "2026-12-07T18:00:00Z",
  "maxEntriesPerUser": 3,
  "requireExif": true,
  "prizeSummary": "$5,000 Total Prizes",
  "categories": [
    {
      "code": "WILDLIFE",
      "name": "Action & Movement",
      "description": "Capturing animal locomotion, flight, or hunting behavior in the wild.",
      "rubricWeights": {
        "composition": 0.20,
        "lighting": 0.15,
        "colorHarmony": 0.10,
        "technicalExecution": 0.25,
        "subjectStory": 0.20,
        "originality": 0.05,
        "emotionAtmosphere": 0.05,
        "overallGestalt": 0.00
      }
    }
  ],
  "jurorEmails": ["expert.judge@wildlifephoto.org"]
}
```
#### Response (`201 Created`)
```json
{
  "id": "comp_clx002",
  "title": "Wildlife in Motion 2026",
  "status": "DRAFT",
  "createdAt": "2026-10-13T01:30:00Z"
}
```

---

### 2.3 Transition Competition State
- **Endpoint:** `PATCH /api/competitions/{id}/status`
- **Access:** Organizer / Admin
- **Request Body:**
```json
{
  "status": "JUDGING"
}
```
#### Response (`200 OK`)
```json
{
  "id": "comp_clx001",
  "previousStatus": "OPEN",
  "newStatus": "JUDGING",
  "activeSubmissionsInQueue": 142,
  "updatedAt": "2026-10-13T01:35:00Z"
}
```

---

## 3. Submission & Scoring Endpoints

### 3.1 Request Presigned Upload URL
- **Endpoint:** `POST /api/submissions/presigned-url`
- **Access:** Participant
- **Description:** Verifies user quota before granting direct-to-cloud upload capability.
- **Request Body:**
```json
{
  "competitionId": "comp_clx001",
  "filename": "street_rain_tokyo.jpg",
  "fileSizeBytes": 14258920,
  "mimeType": "image/jpeg"
}
```
#### Response (`200 OK`)
```json
{
  "submissionId": "sub_98124a",
  "uploadUrl": "https://pixel-prize-media.r2.cloudflarestorage.com/raw-uploads/sub_98124a.jpg?X-Amz-Signature=...",
  "storageKey": "raw-uploads/sub_98124a.jpg",
  "expiresAt": "2026-10-13T01:45:00Z"
}
```

---

### 3.2 Confirm Submission & Enqueue Scoring
- **Endpoint:** `POST /api/submissions`
- **Access:** Participant
- **Request Body:**
```json
{
  "submissionId": "sub_98124a",
  "competitionId": "comp_clx001",
  "categoryId": "cat_street",
  "title": "Reflections in Shibuya",
  "story": "Captured during a sudden midnight monsoon downpour in Shibuya. The neon signs mirrored across wet asphalt.",
  "clientExif": {
    "cameraMake": "Sony",
    "cameraModel": "ILCE-7M4",
    "lensModel": "FE 35mm F1.4 GM",
    "focalLength": 35.0,
    "aperture": 1.8,
    "shutterSpeed": "1/160",
    "iso": 800,
    "captureTime": "2026-09-12T14:22:10Z"
  }
}
```
#### Response (`202 Accepted`)
```json
{
  "submissionId": "sub_98124a",
  "status": "IN_QUEUE",
  "message": "Submission received. Ingestion, forensics, and AI scoring scheduled.",
  "queuePosition": 4
}
```

---

### 3.3 Get AI Diagnostic Scorecard
- **Endpoint:** `GET /api/submissions/{id}/scorecard`
- **Access:** Owner Participant (Private) OR Public if results published
#### Response (`200 OK`)
```json
{
  "submissionId": "sub_98124a",
  "overallScore": 88.5,
  "themeAdherenceScore": 95.0,
  "attributeScores": {
    "composition": 92.0,
    "lighting": 89.0,
    "colorHarmony": 91.0,
    "technicalExecution": 85.0,
    "subjectStory": 88.0,
    "originality": 82.0,
    "emotionAtmosphere": 90.0,
    "overallGestalt": 89.0
  },
  "detectedCompositionRules": [
    "Leading Lines",
    "Rule of Thirds",
    "Color and Contrast"
  ],
  "defectDeductions": {
    "totalPenalty": 0.0,
    "detectedDefects": []
  },
  "critique": {
    "strengths": "Masterful control of reflective leading lines converging on the solitary umbrella figure. The neon color contrast between cyan streetlamps and amber storefronts creates extraordinary visual rhythm.",
    "technicalAnalysis": "Tack-sharp critical focus on the umbrella fabric at f/1.8. Controlled highlight retention on bright neon signs with natural bokeh falloff.",
    "recommendations": "Slightly crop 2% off the top edge to eliminate a clipped halogen streetlamp flare."
  },
  "forensicsSummary": {
    "syntheticLikelihood": 0.03,
    "isLikelyAuthenticPhoto": true,
    "forensicNotes": "Authentic Sony sensor PRNU noise, valid EXIF tags."
  },
  "percentileRank": "Top 6% in Street Photography"
}
```

---

### 3.4 Community Upvote
- **Endpoint:** `POST /api/submissions/{id}/vote`
- **Access:** Authenticated User
#### Response (`200 OK`)
```json
{
  "submissionId": "sub_98124a",
  "hasVoted": true,
  "newVoteCount": 184
}
```

---

## 4. Juror Endpoints

### 4.1 Get Shortlist for Judging
- **Endpoint:** `GET /api/juror/competitions/{id}/shortlist`
- **Access:** Assigned Juror / Organizer
#### Response (`200 OK`)
```json
{
  "competitionId": "comp_clx001",
  "shortlistedCount": 10,
  "entries": [
    {
      "submissionId": "sub_98124a",
      "category": "Street Photography",
      "title": "Reflections in Shibuya",
      "story": "Captured during a sudden midnight monsoon downpour...",
      "aiOverallScore": 88.5,
      "images": {
        "originalUrl": "https://media.pixelprize.org/competitions/comp_clx001/original/sub_98124a.jpg",
        "webUrl": "https://media.pixelprize.org/competitions/comp_clx001/web/sub_98124a.webp"
      },
      "exif": {
        "camera": "Sony ILCE-7M4",
        "lens": "FE 35mm F1.4 GM",
        "exposure": "1/160s, f/1.8, ISO 800"
      },
      "aiCritiqueSummary": "Masterful control of reflective leading lines..."
    }
  ]
}
```

---

### 4.2 Submit Final Juror Verdict
- **Endpoint:** `POST /api/juror/competitions/{id}/verdict`
- **Access:** Assigned Juror
- **Request Body:**
```json
{
  "podiums": [
    {
      "submissionId": "sub_98124a",
      "podiumRank": "FIRST_PLACE",
      "jurorRemarks": "An undeniably breathtaking capture of atmospheric city life. Perfect emotional resonance."
    },
    {
      "submissionId": "sub_77182b",
      "podiumRank": "SECOND_PLACE",
      "jurorRemarks": "Striking graphic silhouette with impeccable timing."
    },
    {
      "submissionId": "sub_33219c",
      "podiumRank": "THIRD_PLACE",
      "jurorRemarks": "Delicate, nuanced tonality across the shadows."
    }
  ]
}
```
#### Response (`200 OK`)
```json
{
  "status": "VERDICT_REGISTERED",
  "competitionId": "comp_clx001",
  "assignedPodiumsCount": 3
}
```
