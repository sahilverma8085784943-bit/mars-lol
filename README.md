# BioScan.AI — Face Recognition Attendance & Biometric Management System

[![React](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_Live-gemini--3.8--live-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An enterprise-grade, contactless biometric face recognition attendance management system built for colleges, universities, and organizations. Features sub-second facial identification, single-face isolation with background passerby filtering, 128-dimensional mathematical vector embeddings, role-based access control, Google Drive cloud sync, and real-time voice assistance powered by the Gemini Live API.

---

## 📑 Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
   - [User Management](#user-management)
   - [Attendance Management](#attendance-management)
3. [Technologies Used](#3-technologies-used)
4. [How It Works](#4-how-it-works)
5. [Screenshots & UI Walkthrough](#5-screenshots--ui-walkthrough)
6. [Installation and Setup](#6-installation-and-setup)
7. [Future Enhancements](#7-future-enhancements)
8. [Developer Info](#8-developer-info)
9. [License](#9-license)

---

## 1. Overview

Traditional attendance systems rely on physical sign-in sheets, paper registers, RFID cards, or fingerprint scanners. These traditional methods suffer from major vulnerabilities:
- **Proxy Attendance / Buddy Punching**: Students punch RFID cards or sign sheets for absent friends.
- **Hygiene & Wear Concerns**: Physical fingerprint readers cause queues and hygiene issues.
- **Data Loss & Administrative Friction**: Manual paper registers require hours of manual data entry at the end of each semester.

**BioScan.AI** solves these problems by providing a high-speed, contactless biometric face recognition system that operates right inside modern web browsers. It converts faces into **128-dimensional mathematical vectors** (ensuring subject privacy without storing raw surveillance biometric templates), isolates the primary student even when multiple people walk past in the background, logs attendance instantly, and syncs reports seamlessly to cloud databases and Google Drive spreadsheets.

---

## 2. Features

### User Management
- **Contactless Biometric Enrollment**:
  - Live webcam snapshot capture or high-resolution photo upload.
  - Interactive crop, retake, and image quality preview.
  - Multi-angle lighting and contrast validation before enrollment.
- **128-Dimensional Vector Extraction**:
  - Faces are mathematically represented as a 128-float embedding using Local Binary Patterns (LBP) and spatial cell luminance.
  - Vector inspector allows admins to audit embeddings directly in the UI.
- **Duplicate Prevention & Verification**:
  - Automatically flags duplicate roll numbers/employee IDs.
  - Computes vector cosine/Euclidean similarity to alert admins if an individual is already enrolled under another profile.
- **Role-Based Access Control (RBAC)**:
  - Three distinct roles: **Admin**, **Staff/Faculty**, and **Student**.
  - Admin features protected by session-authenticated passkeys: emergency lockdown, database purges, and record overrides.
- **Privacy & Compliance First**:
  - Explicit subject consent checkbox required prior to storing facial descriptor vectors.
  - Dedicated **"Purge Biometric Data"** action that erases facial vectors and photos while preserving historical attendance logs.
- **Enrolled Roster Snippets & Gallery**:
  - Responsive gallery view with search, department filtering, and status badges.
  - Toggle between **Mini Micro-Grid (16 subjects)** and **Standard Cards** on the executive dashboard.

---

### Attendance Management
- **Contactless Camera Scanner with Sci-Fi HUD**:
  - Targeting reticle with 4 corner biometric brackets (`b-tl`, `b-tr`, `b-bl`, `b-br`), animated scanline sweep, and real-time radar ping.
  - Real-time Euclidean distance calculation matching against stored vectors.
- **Single-Face Foreground Isolation (Anti-Crowd)**:
  - When coworkers or students walk past in the background, the scanner locks onto the primary foreground face inside the center viewfinder.
  - Automatically marks background faces with dashed amber `[BG Ignored]` indicators without rejecting the primary user.
  - Toggle between **1-Face Focus** mode and strict 1-person enforcement.
- **Duplicate Attendance Lockout**:
  - Prevents double-marking attendance on the same calendar day.
  - Features an authorized Admin Override modal for special circumstances.
- **Multi-Sensory Confirmation**:
  - Sonar acquisition beep upon face lock.
  - Confetti burst animation and celebratory audio chime upon verified attendance.
- **Daily Attendance Reports & Exports**:
  - Printable, publication-ready daily attendance sheets generated directly via `jsPDF`.
  - CSV export for student rosters and daily logs with date and department filters.
- **Google Drive Cloud Sync**:
  - Native integration with 1P Google Workspace APIs (Google Drive & Sheets) for automated off-site cloud backups.
- **Gemini Live AI Voice Assistant**:
  - Real-time bidirectional voice conversations powered by `gemini-3.8-live`.
  - Speak naturally with the kiosk using 16kHz microphone capture and 24kHz raw PCM low-latency audio playback.
  - Ask questions like: *"Who was present today from Computer Science?"* or *"What is my attendance percentage?"*

---

## 3. Technologies Used

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)
- **Delight Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

### Biometrics & Computer Vision
- **Vector Space**: 128-dimensional normalized floating-point descriptor vectors.
- **Algorithm**: Local Binary Pattern (LBP) cell texture extraction with spatial luminance histogram analysis.
- **Distance Metric**: Euclidean distance calculation with configurable confidence thresholds ($\le 0.48$).
- **Face Isolation**: Dynamic bounding box spatial clustering with background peripheral suppression.

### Backend & Cloud Services
- **Server Runtime**: Node.js + [Express](https://expressjs.com/) with TypeScript execution via [tsx](https://github.com/privatenumber/tsx).
- **Real-Time WebSockets**: [ws](https://github.com/websockets/ws) for low-latency streaming to the AI model.
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & Storage Buckets) + LocalStorage offline-first fallback.
- **Cloud Backup**: Google Drive REST API & OAuth 2.0.
- **Multimodal AI**: [@google/genai](https://www.npmjs.com/package/@google/genai) SDK connecting to the `gemini-3.8-live` model.

---

## 4. How It Works

```
   ┌────────────────────────────────────────────────────────┐
   │                    Live Camera Feed                    │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            Skin-Tone & Spatial Clustering              │
   │  - Analyzes RGB/Luminance in center reticle            │
   │  - Detects background vs foreground candidate faces   │
   └───────────────────────────┬────────────────────────────┘
                               │
               Is 1-Face Focus Enabled?
             ┌─────────────────┴─────────────────┐
            YES                                  NO
             │                                   │
             ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  Isolate Center Target Face  │    │ Fail if >1 face detected    │
│  Ignore Peripheral/BG Faces  │    │ Show "Multiple Faces" Error  │
└────────────┬─────────────────┘    └──────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│             128-D Vector Descriptor Extraction         │
│  - Crops face bounding box (primary subject)           │
│  - Computes 128-point spatial LBP texture histogram    │
│  - Normalizes descriptor vector: ||v|| = 1.0           │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Euclidean Distance Matching                │
│  - Compares against all enrolled user descriptors      │
│  - Finds lowest distance: d(v_input, v_enrolled)       │
└───────────────────────────┬────────────────────────────┘
                            │
               Is d <= Confidence Threshold (0.48)?
             ┌──────────────┴──────────────┐
            YES                            NO
             │                             │
             ▼                             ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   Match Found (Recognized)   │  │   Unknown Face Detected       │
│  - Check duplicate today     │  │   Prompt admin enrollment    │
│  - Play chime + confetti     │  └──────────────────────────────┘
│  - Commit log to Supabase/DB │
└──────────────────────────────┘
```

---

## 5. Screenshots & UI Walkthrough

### 1. Executive Analytics Dashboard
- Total active subjects enrolled, today's check-in velocity, and cohort attendance rates.
- Micro-mini enrolled roster gallery displaying 16 student thumbnails with status indicators.
- Quick action navigation to Enrollment, Live Scanner, and Historical Logs.

### 2. Live Recognition HUD (Kiosk Mode)
- Sci-fi targeting reticle with corner alignment brackets.
- Visual background rejection tags: `[BG Ignored]` for bystanders and passersby.
- Audio cues: Sonar ping for target acquisition, cheerful chime for attendance confirmed.

### 3. Biometric Enrollment Modal
- Live camera snapshot or file dropzone.
- Automatic quality validation ensuring clear illumination and center alignment.
- Mandatory legal consent acknowledgment for student data protection.

### 4. Interactive Voice Assistant (Gemini Live)
- Circular pulsating audio visualizer reacting in real-time to speech amplitude.
- Prebuilt persona switcher: Zephyr (Executive), Puck (Energetic), Kore (Warm), Fenrir (Authoritative).
- Conversational querying of class attendance records.

---

## 6. Installation and Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Modern web browser with camera and microphone permissions enabled (Chrome, Edge, Firefox, Safari)

### Step 1: Clone the Repository
```bash
git clone https://github.com/sahilverma8085784943/BioScan.AI-Biometric-Attendance.git
cd BioScan.AI-Biometric-Attendance
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Google Gemini API Key (Required for Gemini Live AI Voice Assistant)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (Optional - falls back to LocalStorage if not provided)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Step 5: Build for Production
```bash
npm run build
npm start
```

---

## 7. Future Enhancements

Planned upgrades for university tech competitions and enterprise deployments:
- [ ] **Active Anti-Spoofing & Liveness Challenge**: Random blink and smile verification to prevent photo/screen spoofing.
- [ ] **Classroom Timetable Resolution**: Automatic tagging of attendance by subject, period, faculty, and room number.
- [ ] **75% Mandatory Attendance Defaulter Engine**: Predictive warnings for students at risk of semester exam debarment.
- [ ] **Automated WhatsApp / Email Alerts**: Instant notifications to students and parents upon check-in or unexcused absence.
- [ ] **GPS Geofencing**: Verification that scans originate within authorized campus lecture hall coordinates.

---

## 8. Developer Info

- **Lead Developer**: Sahil Verma
- **Email**: [sahilverma8085784943@gmail.com](mailto:sahilverma8085784943@gmail.com)
- **Role**: Full-Stack AI Engineer
- **Project**: AI-Powered Biometric Face Recognition & Attendance Management System
- **Academic Domain**: Computer Vision, Artificial Intelligence, and Smart Campus Automation

---

## 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Sahil Verma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```
