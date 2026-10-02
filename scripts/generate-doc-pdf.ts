import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildDocumentationPdf(): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28 pt

  let currentPage = 1;

  // Helper to add standard header & footer on pages
  function renderHeaderFooter(title = 'BioScan.AI — System Documentation') {
    // Top banner line
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(2);
    doc.line(margin, 35, pageWidth - margin, 35);

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 157, 110);
    doc.text('BIOSCAN.AI BIOMETRIC PLATFORM', margin, 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(title, pageWidth - margin, 28, { align: 'right' });

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);

    // Footer text
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Smart Campus Biometric Attendance System • Confidential & Proprietary', margin, pageHeight - 24);
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
  }

  // Helper to advance page
  function newPage(headerTitle?: string): number {
    doc.addPage('a4', 'portrait');
    currentPage++;
    renderHeaderFooter(headerTitle);
    return 55; // Initial Y after header
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Background cover design
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative cyber accents
  doc.setFillColor(16, 185, 129); // emerald
  doc.rect(0, 0, 8, pageHeight, 'F');

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, 60, contentWidth, 120, 8, 8, 'F');

  // Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 20, 80, 140, 20, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ENTERPRISE GRADE AI', margin + 30, 93);

  // Main Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('BioScan.AI', margin + 20, 135);

  doc.setFontSize(14);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('Biometric Face Recognition Attendance System', margin + 20, 158);

  // Subtitle / Executive Overview
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(203, 213, 225);
  const coverSummary = doc.splitTextToSize(
    'A full-stack, contactless biometric face recognition attendance management platform engineered for universities, colleges, and enterprise organizations. Eliminates proxy attendance with sub-second identification, single-face foreground isolation, 128-dimensional vector descriptors, and real-time Gemini Live AI voice assistance.',
    contentWidth
  );
  doc.text(coverSummary, margin, 210);

  // Metadata Card
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, 290, contentWidth, 140, 8, 8, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin, 290, contentWidth, 140, 8, 8, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153);
  doc.text('PROJECT SPECIFICATION & METADATA', margin + 20, 315);

  const metaList = [
    { label: 'Lead Developer', val: 'Sahil Verma (sahilverma8085784943@gmail.com)' },
    { label: 'Domain', val: 'Computer Vision • Biometric Security • Smart Campus Systems' },
    { label: 'Core AI Models', val: 'Local Binary Pattern (LBP) 128-D Descriptors • Gemini Live (3.8)' },
    { label: 'Recognition Speed', val: '< 250 milliseconds with Euclidean distance matching' },
    { label: 'Cloud Backups', val: 'Supabase PostgreSQL + Google Drive Spreadsheet Sync' },
    { label: 'License', val: 'MIT Open Source License' },
  ];

  metaList.forEach((item, idx) => {
    const y = 338 + idx * 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${item.label}:`, margin + 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(241, 245, 249);
    doc.text(item.val, margin + 145, y);
  });

  // Table of Contents Preview Box
  doc.setFillColor(15, 32, 39);
  doc.roundedRect(margin, 455, contentWidth, 310, 8, 8, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.roundedRect(margin, 455, contentWidth, 310, 8, 8, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(52, 211, 153);
  doc.text('TABLE OF CONTENTS', margin + 20, 485);

  const tocItems = [
    { num: '1.', title: 'Overview & Problem Statement', page: 'Page 2' },
    { num: '2.', title: 'Features (User & Attendance Management)', page: 'Page 2' },
    { num: '3.', title: 'Technologies Used & Architecture Stack', page: 'Page 3' },
    { num: '4.', title: 'How It Works (Biometric Extraction & Matching Pipeline)', page: 'Page 3' },
    { num: '5.', title: 'Screenshots & UI Walkthrough', page: 'Page 4' },
    { num: '6.', title: 'Installation & Local Setup Guide', page: 'Page 4' },
    { num: '7.', title: 'Future Enhancements (Liveness, Timetable, 75% Rule)', page: 'Page 5' },
    { num: '8.', title: 'Developer Info & Academic Scope', page: 'Page 5' },
    { num: '9.', title: 'License & Open Source Compliance', page: 'Page 5' },
  ];

  tocItems.forEach((item, idx) => {
    const y = 515 + idx * 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(52, 211, 153);
    doc.text(item.num, margin + 20, y);
    doc.setTextColor(241, 245, 249);
    doc.setFont('helvetica', 'normal');
    doc.text(item.title, margin + 40, y);

    // Dots
    doc.setTextColor(71, 85, 105);
    doc.text('. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', margin + 280, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153);
    doc.text(item.page, margin + contentWidth - 45, y);
  });

  // Footer on cover
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated for University Tech Competitions, Hackathons & Production Deployments', margin, pageHeight - 30);

  // ==========================================
  // PAGE 2: SECTIONS 1 & 2
  // ==========================================
  let curY = newPage('Sections 1 & 2 — Overview and Core Features');

  // Section 1: Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Overview', margin, curY);
  curY += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const overviewP1 = doc.splitTextToSize(
    'Traditional college and university attendance workflows rely heavily on paper registers, manual roll calls, or RFID smart cards. These obsolete methods suffer from critical vulnerabilities: buddy punching (students signing or swiping cards for absent peers), long bottlenecks at entrance doors, physical wear-and-tear on fingerprint sensors, and tedious manual data entry at the end of each academic semester.',
    contentWidth
  );
  doc.text(overviewP1, margin, curY);
  curY += overviewP1.length * 13 + 8;

  const overviewP2 = doc.splitTextToSize(
    'BioScan.AI delivers an enterprise-grade, contactless biometric solution designed to run natively within modern client browsers. It converts video camera streams into privacy-preserving 128-dimensional mathematical vector descriptors, performs sub-second Euclidean matching, suppresses background passersby through single-face foreground isolation, and provides automated reporting to Supabase PostgreSQL and Google Drive.',
    contentWidth
  );
  doc.text(overviewP2, margin, curY);
  curY += overviewP2.length * 13 + 18;

  // Section 2: Features
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Features', margin, curY);
  curY += 18;

  // Subsection 2.1: User Management
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 157, 110);
  doc.text('2.1 User Management & Biometric Enrollment', margin, curY);
  curY += 14;

  const userMgmtPoints = [
    '• Live Webcam & File Upload Enrollment: Capture instant webcam photos or upload high-resolution images with real-time contrast, illumination, and quality checks.',
    '• 128-Dimensional Mathematical Vector Descriptors: Generates 128-float normalized facial embeddings without storing invasive raw biometric templates.',
    '• Duplicate Roll & Vector Detection: Automatically blocks duplicate roll numbers and flags identical facial descriptors to stop multi-profile spoofing.',
    '• Role-Based Access Control (RBAC): Admin, Faculty/Staff, and Student roles with session-authenticated security passkeys for database-altering tasks.',
    '• Privacy-First Data Purge: Timestamped legal consent tracking and a dedicated "Purge Biometric Data" option that removes vectors while keeping attendance history.',
    '• Compact Micro-Roster Preview: Executive dashboard snippet displaying 16 enrolled student thumbnails simultaneously with status indicators.',
  ];

  userMgmtPoints.forEach((pt) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(pt, contentWidth - 10);
    doc.text(lines, margin + 8, curY);
    curY += lines.length * 12 + 4;
  });

  curY += 10;

  // Subsection 2.2: Attendance Management
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 157, 110);
  doc.text('2.2 Attendance Management & Live Kiosk Mode', margin, curY);
  curY += 14;

  const attMgmtPoints = [
    '• Sub-Second Biometric Scanner HUD: Reticle brackets, animated scanline sweep, and real-time Euclidean distance classification (threshold <= 0.48).',
    '• 1-Face Focus & Background Rejection: Dynamically isolates the primary foreground face while tagging passersby with dashed amber "[BG Ignored]" boxes.',
    '• Duplicate Attendance Lockout: Prevents multiple check-ins on the same calendar day, with an authorized Admin Override modal.',
    '• Multi-Sensory Feedback: High-tech sonar acquisition ping, confetti celebration particles, and clear audio chimes on verified attendance.',
    '• Official Daily Attendance PDF & CSV Exports: Generates publication-ready PDF attendance sheets (via jsPDF) and downloadable CSVs.',
    '• Gemini Live Multimodal AI Voice Assistant: Real-time 2-way voice kiosk assistant powered by gemini-3.8-live for hands-free queries.',
  ];

  attMgmtPoints.forEach((pt) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(pt, contentWidth - 10);
    doc.text(lines, margin + 8, curY);
    curY += lines.length * 12 + 4;
  });

  // ==========================================
  // PAGE 3: SECTIONS 3 & 4
  // ==========================================
  curY = newPage('Sections 3 & 4 — Technologies Used and Technical Pipeline');

  // Section 3: Technologies Used
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Technologies Used', margin, curY);
  curY += 16;

  // Tech table
  const techData = [
    { tier: 'Frontend Framework', stack: 'React 19.0.1, TypeScript 5.x, Vite 8', desc: 'Component architecture, strict typing, high-speed HMR build' },
    { tier: 'Styling & UI Effects', stack: 'Tailwind CSS v4, Lucide Icons, Confetti', desc: 'Responsive dark/light cyber aesthetic and micro-animations' },
    { tier: 'Computer Vision', stack: 'HTML5 Canvas 2D + LBP Texture Engine', desc: '128-dimensional normalized floating-point descriptor extraction' },
    { tier: 'Matching Metric', stack: 'Euclidean Vector Distance (<= 0.48)', desc: 'Nearest-neighbor vector comparison with confidence thresholding' },
    { tier: 'Backend & Server', stack: 'Node.js, Express, tsx, WebSockets (ws)', desc: 'Full-stack server with Vite middleware & bidirectional audio streams' },
    { tier: 'Database & Security', stack: 'Supabase PostgreSQL, Row Level Security', desc: 'Cloud database, private storage buckets, and LocalStorage cache' },
    { tier: 'Multimodal AI', stack: 'Google Gemini Live API (gemini-3.8-live)', desc: '16kHz microphone stream to 24kHz raw PCM real-time voice' },
    { tier: 'Cloud Document Sync', stack: 'Google Drive REST API + OAuth 2.0', desc: 'Automated off-site cloud backups and Google Sheets sync' },
  ];

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, curY, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TIER', margin + 8, curY + 14);
  doc.text('STACK / LIBRARIES', margin + 110, curY + 14);
  doc.text('FUNCTIONAL ROLE', margin + 295, curY + 14);
  curY += 20;

  techData.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(margin, curY, contentWidth, 18, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + 18, margin + contentWidth, curY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(row.tier, margin + 8, curY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 118, 110);
    doc.text(row.stack, margin + 110, curY + 12);

    doc.setTextColor(71, 85, 105);
    doc.text(row.desc, margin + 295, curY + 12);

    curY += 18;
  });

  curY += 18;

  // Section 4: How It Works
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('4. How It Works (Algorithmic Pipeline)', margin, curY);
  curY += 16;

  const pipelineSteps = [
    { step: 'Step 1: Frame Acquisition', text: 'HTML5 Video streams 30fps webcam feed into an in-memory canvas context with willReadFrequently optimization.' },
    { step: 'Step 2: Spatial Clustering & Background Suppression', text: 'RGB skin-tone thresholding (r > 60, r > g, r > b) measures cluster centroids. If Single-Face Focus is active, peripheral clusters are marked [BG Ignored] and filtered out.' },
    { step: 'Step 3: 128-D Vector Extraction', text: 'The isolated primary face is normalized into an 8x8 grid. Local Binary Patterns (LBP) compute micro-texture and spatial luminance variances, yielding a 128-float unit-normalized vector.' },
    { step: 'Step 4: Euclidean Distance Matching', text: 'The vector is compared against all enrolled user descriptors using: d = sqrt(sum((v_i - u_i)^2)). The lowest distance is matched against the confidence threshold (0.48).' },
    { step: 'Step 5: Transaction Commit & Multi-Sensory Trigger', text: 'On successful match, duplicate same-day attendance is verified. A record is logged in Supabase / LocalStorage, accompanied by celebratory confetti and an audio chime.' },
  ];

  pipelineSteps.forEach((st) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, curY, contentWidth, 28, 4, 4, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, curY, contentWidth, 28, 4, 4, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 157, 110);
    doc.text(st.step, margin + 10, curY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const desc = doc.splitTextToSize(st.text, contentWidth - 20);
    doc.text(desc, margin + 10, curY + 22);

    curY += 34;
  });

  // ==========================================
  // PAGE 4: SECTIONS 5 & 6
  // ==========================================
  curY = newPage('Sections 5 & 6 — UI Walkthrough and Installation Guide');

  // Section 5: Screenshots & UI Walkthrough
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Screenshots & UI Walkthrough', margin, curY);
  curY += 16;

  const uiSections = [
    {
      title: 'Executive Analytics Dashboard',
      desc: 'Features real-time attendance KPIs (Cohort Attendance Rate %, Present Today, Total Enrolled, Vector Quality Score), launch buttons for Kiosk Scanner, and the Mini Roster Preview.',
    },
    {
      title: 'Kiosk Camera Reticle HUD',
      desc: 'High-tech biometric targeting reticle with animated scanline sweep, real-time Euclidean distance indicator, background passerby suppression [BG Ignored], and audio feedback.',
    },
    {
      title: 'Biometric Enrollment & Quality Control',
      desc: 'Webcam snapshot or file dropzone with lighting verification, roll number uniqueness checks, interactive crop preview, and legal biometric consent checkboxes.',
    },
    {
      title: 'Real-Time Gemini Live AI Voice Assistant',
      desc: 'Bidirectional audio kiosk assistant streaming over WebSockets. Features voice visualizer orbs, persona selection (Zephyr, Puck, Kore, Fenrir), and hands-free attendance inquiries.',
    },
  ];

  uiSections.forEach((ui) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${ui.title}`, margin + 5, curY);
    curY += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(ui.desc, contentWidth - 15);
    doc.text(lines, margin + 15, curY);
    curY += lines.length * 11 + 6;
  });

  curY += 12;

  // Section 6: Installation and Setup
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('6. Installation and Setup Guide', margin, curY);
  curY += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 157, 110);
  doc.text('Prerequisites: Node.js (v18.0.0 or higher), npm or yarn, webcam/microphone enabled browser.', margin, curY);
  curY += 16;

  const installSteps = [
    { title: 'Step 1: Clone Repository', code: 'git clone https://github.com/sahilverma8085784943/BioScan.AI-Biometric-Attendance.git\ncd BioScan.AI-Biometric-Attendance' },
    { title: 'Step 2: Install NPM Dependencies', code: 'npm install' },
    { title: 'Step 3: Configure Environment Variables (.env)', code: 'GEMINI_API_KEY=your_gemini_api_key_here\nVITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your_anon_key_here' },
    { title: 'Step 4: Launch Local Development Server', code: 'npm run dev\n# Open http://localhost:3000 in Google Chrome or Microsoft Edge' },
    { title: 'Step 5: Production Build & Deployment', code: 'npm run build\nnpm start' },
  ];

  installSteps.forEach((inst) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(inst.title, margin, curY);
    curY += 11;

    // Code block box
    const codeLines = inst.code.split('\n');
    const boxH = codeLines.length * 11 + 8;
    doc.setFillColor(15, 23, 42); // dark box
    doc.roundedRect(margin, curY, contentWidth, boxH, 3, 3, 'F');

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(52, 211, 153); // emerald text
    codeLines.forEach((cline, ci) => {
      doc.text(cline, margin + 8, curY + 10 + ci * 11);
    });

    curY += boxH + 6;
  });

  // ==========================================
  // PAGE 5: SECTIONS 7, 8, 9
  // ==========================================
  curY = newPage('Sections 7, 8 & 9 — Roadmap, Developer, and License');

  // Section 7: Future Enhancements
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('7. Future Enhancements & Competition Roadmap', margin, curY);
  curY += 16;

  const enhancements = [
    {
      title: 'Active Liveness & Anti-Spoofing Detection',
      desc: 'Interactive blink, smile, and head-tilt challenge-response tests to prevent photo or video playback attacks from mobile screens or printed sheets.',
    },
    {
      title: 'Lecture & Period-Wise Timetable Integration',
      desc: 'Automatic class resolution mapping timestamped scans to subjects (e.g., CS301 - Data Structures), assigned faculty, and lecture hall numbers.',
    },
    {
      title: '75% Mandatory Attendance Defaulter Engine',
      desc: 'Automated predictive warnings calculating the exact number of classes a student can safely miss before being debarred from semester examinations.',
    },
    {
      title: 'Campus GPS Geofencing & Wi-Fi BSSID Binding',
      desc: 'Verifies that scans originate physically inside the designated lecture hall coordinates and connected to authorized university access points.',
    },
    {
      title: 'Automated WhatsApp & Email Notifications',
      desc: 'Instant check-in receipts sent to students and automated shortage warnings triggered to parents for unexcused consecutive absences.',
    },
  ];

  enhancements.forEach((enh) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, curY, contentWidth, 32, 4, 4, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, curY, contentWidth, 32, 4, 4, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 157, 110);
    doc.text(`[Roadmap] ${enh.title}`, margin + 10, curY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const desc = doc.splitTextToSize(enh.desc, contentWidth - 20);
    doc.text(desc, margin + 10, curY + 23);

    curY += 38;
  });

  curY += 10;

  // Section 8: Developer Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('8. Developer Info', margin, curY);
  curY += 16;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, curY, contentWidth, 90, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(52, 211, 153);
  doc.text('Sahil Verma', margin + 18, curY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(241, 245, 249);
  doc.text('Lead Full-Stack AI Engineer & Computer Vision Researcher', margin + 18, curY + 39);

  doc.setTextColor(148, 163, 184);
  doc.text('Email:', margin + 18, curY + 54);
  doc.setTextColor(52, 211, 153);
  doc.text('sahilverma8085784943@gmail.com', margin + 55, curY + 54);

  doc.setTextColor(148, 163, 184);
  doc.text('Academic Focus: Artificial Intelligence, Biometric Authentication, and Edge Computing.', margin + 18, curY + 70);

  curY += 106;

  // Section 9: License
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('9. License', margin, curY);
  curY += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const licenseText = doc.splitTextToSize(
    'This project is licensed under the MIT License. Copyright (c) 2026 Sahil Verma. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.',
    contentWidth
  );
  doc.text(licenseText, margin, curY);

  // Return generated buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

// Generate the file directly if executed via CLI
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.resolve(publicDir, 'BioScan_AI_Project_Documentation.pdf');
const pdfBuffer = buildDocumentationPdf();
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`[BioScan.AI] Successfully generated documentation PDF: ${outputPath} (${pdfBuffer.length} bytes)`);
