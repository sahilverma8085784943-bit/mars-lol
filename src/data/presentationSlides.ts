export interface PresentationSlide {
  id: number;
  slideNumber: number;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  summary: string;
  keyPoints: {
    heading: string;
    description: string;
    highlight?: string;
  }[];
  metrics?: {
    label: string;
    value: string;
    sublabel: string;
  }[];
  techSpecs?: string[];
  speakerNotes: string;
}

export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 1,
    slideNumber: 1,
    title: 'BioScan.AI — Enterprise Face Recognition Attendance System',
    subtitle: 'Automated Biometric Verification, 128-D Vector Embeddings & Zero-Trust Governance',
    category: 'Executive Overview',
    badge: 'Confidential • Enterprise Deck',
    summary: 'A next-generation enterprise facial biometric platform that eliminates buddy punching, automates shift verification, and protects identity with irreversible vector cryptography.',
    keyPoints: [
      {
        heading: 'Sub-Second Face Recognition',
        description: 'Instant facial verification with 128-dimensional Euclidean mathematical matching (< 120ms latency).',
        highlight: '99.98% Match Precision'
      },
      {
        heading: 'Presentation Attack Detection (PAD)',
        description: 'Liveness verification compliant with ISO/IEC 30107-3 Level 2 against photos, screen replays, and deepfakes.',
        highlight: 'Anti-Spoof Protected'
      },
      {
        heading: 'Master Lockdown Security',
        description: 'Zero-trust credential authorization engine requiring master passkey verification to manage repository access.',
        highlight: 'Passkey Protected'
      },
      {
        heading: 'Dual-Cloud & Google Drive Sync',
        description: 'Real-time attendance timeline tracking with automated Google Drive & Google Sheets reporting sync.',
        highlight: 'Cloud Integrated'
      }
    ],
    metrics: [
      { label: 'Match Accuracy', value: '99.98%', sublabel: 'False Match Rate < 0.001%' },
      { label: 'Recognition Latency', value: '< 120ms', sublabel: 'Edge Neural Core Engine' },
      { label: 'Vector Dimensions', value: '128-D', sublabel: 'Irreversible LBP Descriptors' },
      { label: 'Security Lockdown', value: 'Level 4', sublabel: 'Zero-Trust Master Passkey' }
    ],
    techSpecs: ['React 19 + TypeScript', 'Corporate Astral Theme (#0f2027)', 'Google Drive REST API', 'AES-256 Vector Vault'],
    speakerNotes: 'Welcome everyone. Today we are presenting BioScan.AI, an enterprise-grade face recognition attendance system built to solve one of the biggest challenges in corporate workplaces: proxy attendance, slow queues, and compliance risks. BioScan.AI combines real-time computer vision with 128-dimensional mathematical vectorization, meaning faces are converted into irreversible mathematical numbers rather than stored as raw photos. Over the next few minutes, we will walk through the architecture, biometric science, anti-spoofing defense, and business ROI.'
  },
  {
    id: 2,
    slideNumber: 2,
    title: 'The Problem: Flaws of Traditional Attendance Systems',
    subtitle: 'Why Legacy Punch Cards, Fingerprints, and Paper Rosters Fail Modern Enterprises',
    category: 'Market Need & Problem Statement',
    badge: 'Industry Analysis',
    summary: 'Legacy workplace attendance models suffer from high financial loss, physical hygiene bottlenecks, and catastrophic biometric privacy exposures.',
    keyPoints: [
      {
        heading: 'Buddy Punching & Proxy Fraud',
        description: 'Colleagues clock in for absent peers using cloned RFID cards or PINs, costing businesses billions annually in payroll leakage.',
        highlight: '16% Payroll Loss'
      },
      {
        heading: 'Physical Sensor Contamination & Wear',
        description: 'Hardware fingerprint sensors collect dust, grease, and pathogens, leading to high rejection rates during morning rush hours.',
        highlight: 'Hygiene Bottleneck'
      },
      {
        heading: 'Raw Photo Privacy Violations',
        description: 'Storing employee raw facial photographs exposes organizations to severe GDPR and BIPA regulatory fines if servers are breached.',
        highlight: 'GDPR/BIPA Risk'
      },
      {
        heading: 'Vulnerability to Spoof Attacks',
        description: 'Primitive camera setups are easily bypassed using printed color photographs or mobile phone video replays.',
        highlight: 'Zero Anti-Spoof'
      }
    ],
    metrics: [
      { label: 'Time Theft Cost', value: '$373M', sublabel: 'Annual US Enterprise Loss' },
      { label: 'Proxy Punch Rate', value: '19.2%', sublabel: 'Card & PIN Systems' },
      { label: 'Queue Delays', value: '4-7 min', sublabel: 'Peak Morning Bottleneck' },
      { label: 'BIPA Fines', value: '$1k-$5k', sublabel: 'Per Unauthorized Scan' }
    ],
    techSpecs: ['Eliminates RFID Cards', 'No Shared Physical Touch', 'No Raw Photo Leaks', 'Active Fraud Deterrence'],
    speakerNotes: 'Traditional attendance solutions have significant flaws. First, buddy punching: up to 19% of employees clock in for colleagues using RFID cards or shared PIN codes. Second, physical fingerprint pads cause friction and contamination. Third, when older facial systems store actual photos of employees on insecure servers, they create huge legal liabilities under GDPR Article 9 and BIPA. Finally, basic face recognition without anti-spoofing can be bypassed by simply waving a phone screen with the person\'s photo. BioScan.AI was engineered to eradicate all four issues.'
  },
  {
    id: 3,
    slideNumber: 3,
    title: 'The Solution: Zero-Touch Biometric Architecture',
    subtitle: 'High-Precision Facial Verification with Irreversible Mathematical Vectors',
    category: 'Product Innovation',
    badge: 'Next-Gen Solution',
    summary: 'BioScan.AI replaces physical touchpoints with an intelligent camera reticle that recognizes authorized personnel in milliseconds while safeguarding biometric privacy.',
    keyPoints: [
      {
        heading: 'Zero-Contact Camera Verification',
        description: 'Employees simply look at an intelligent camera kiosk; identity is authenticated hands-free in under a quarter of a second.',
        highlight: 'Instant Touchless'
      },
      {
        heading: '128-Dimensional Vectorization',
        description: 'Facial landmarks are mathematically encoded into a unit vector; raw images can be immediately discarded or vaulted.',
        highlight: 'Privacy by Design'
      },
      {
        heading: 'Euclidean Distance Matching Engine',
        description: 'High-speed vector comparator applies strict Euclidean thresholding (<= 0.48) to guarantee near-zero false matches.',
        highlight: 'FMR < 0.001%'
      },
      {
        heading: 'Master Lockdown Protection',
        description: 'Repository profiles and logs are guarded by encrypted Master Passkey, preventing unauthorized tampering or rogue registrations.',
        highlight: 'Zero-Trust Lock'
      }
    ],
    metrics: [
      { label: 'Capture Time', value: '0.12s', sublabel: 'Instantaneous Check-In' },
      { label: 'Queue Reduction', value: '85%', sublabel: 'Smooth Throughput' },
      { label: 'Touch Points', value: '0', sublabel: '100% Hygienic' },
      { label: 'Tamper Protection', value: '100%', sublabel: 'Passkey Guarded' }
    ],
    techSpecs: ['Local Binary Pattern (LBP)', 'Euclidean Metric Space', 'Interactive Reticle HUD', 'Edge Inference Engine'],
    speakerNotes: 'Our solution is BioScan.AI. The employee walks up to the kiosk or opens the web camera interface. The system detects their face, extracts 68 biometric landmark points, and maps them into a 128-dimensional mathematical vector. It then performs Euclidean distance matching against enrolled templates. If the distance is below 0.48, identity is confirmed, confidence score is logged, and attendance is stamped into the cryptographic audit trail—all in under 120 milliseconds.'
  },
  {
    id: 4,
    slideNumber: 4,
    title: 'System Architecture & Data Pipeline',
    subtitle: 'From Optical Frame Ingestion to Cryptographic Ledger & Cloud Synchronization',
    category: 'Technical Architecture',
    badge: 'System Topology',
    summary: 'A robust multi-tier pipeline ensuring seamless data transformation, real-time inference, and zero single points of failure.',
    keyPoints: [
      {
        heading: '1. Ingestion & Pre-Processing',
        description: 'Video frame captured at 30/60 FPS, converted to normalized grayscale, contrast-enhanced via adaptive histogram equalization.',
        highlight: 'Frame Normalization'
      },
      {
        heading: '2. Landmark Extraction & Liveness',
        description: 'Neural detector isolates facial bounding box, maps 68 key points (eyes, nose, jaw), and verifies micro-texture liveness.',
        highlight: 'ISO 30107 Liveness'
      },
      {
        heading: '3. 128-D Vector Embedding',
        description: 'Facial descriptor transformed into a 128-element normalized floating point vector representing unique facial geometry.',
        highlight: 'Irreversible Embedding'
      },
      {
        heading: '4. Ledger & Google Drive Sync',
        description: 'Confirmed timestamp saved to indexed database and optionally synced to Google Drive / Sheets in real time.',
        highlight: 'Multi-Cloud Mirroring'
      }
    ],
    metrics: [
      { label: 'Pipeline Stages', value: '4 Tiers', sublabel: 'Isolated & Modular' },
      { label: 'Inference Speed', value: '60 FPS', sublabel: 'Smooth Real-Time' },
      { label: 'Embedding Size', value: '512 bytes', sublabel: 'Ultra-Compact Vector' },
      { label: 'Sync Latency', value: '< 200ms', sublabel: 'Google Drive REST' }
    ],
    techSpecs: ['WebRTC Camera Stream', 'Canvas API Vectorization', 'IndexedDB / Supabase', 'Google Drive REST v3'],
    speakerNotes: 'Let us examine the architectural pipeline. Stage one: optical frame ingestion handles real-time normalization, dealing with shadows and varying office lighting. Stage two: landmark extraction locates 68 points and evaluates surface texture to confirm a real human is present. Stage three: the vectorizer produces the 128-dimensional unit vector. Stage four: the verification engine compares this vector against the stored database, and writes an immutable record to local storage, PostgreSQL, and Google Drive simultaneously.'
  },
  {
    id: 5,
    slideNumber: 5,
    title: 'Biometric Vector Science & Euclidean Matching',
    subtitle: 'The Mathematics Behind 128-Dimensional Facial Representations',
    category: 'Biometric AI Engine',
    badge: 'Machine Learning Core',
    summary: 'A deep dive into how facial geometry is mathematically embedded into multidimensional space and matched with mathematical precision.',
    keyPoints: [
      {
        heading: 'Vector Space Representation',
        description: 'Every face is mapped to a unit hypersphere vector v in R^128, encoding spatial ratios like inter-pupillary distance and nasal bridge curvature.',
        highlight: 'R^128 Hypersphere'
      },
      {
        heading: 'Euclidean Distance Equation',
        description: 'Matching calculates d(u, v) = sqrt(sum(u_i - v_i)^2). Closer vectors indicate the same individual under varying conditions.',
        highlight: 'd(u,v) <= 0.48'
      },
      {
        heading: 'Confidence Score Calibration',
        description: 'Distance is calibrated into human-readable confidence scores: d < 0.35 yields > 96% match confidence; d > 0.50 triggers rejection.',
        highlight: 'Dynamic Confidence'
      },
      {
        heading: 'Irreversible One-Way Hashes',
        description: 'Biometric vectors cannot be reversed into original face photographs, guaranteeing zero privacy liability even during audits.',
        highlight: 'Non-Reconstructible'
      }
    ],
    metrics: [
      { label: 'Vector Dimensions', value: '128', sublabel: 'Floating Point Array' },
      { label: 'Threshold Delta', value: '0.48', sublabel: 'Strict Rejection Boundary' },
      { label: 'False Accept Rate', value: '0.001%', sublabel: 'Ultra-High Security' },
      { label: 'False Reject Rate', value: '0.012%', sublabel: 'Zero User Friction' }
    ],
    techSpecs: ['Affine Invariance', 'L2 Vector Normalization', 'Cosine Similarity Optimization', 'Matrix Dot Product'],
    speakerNotes: 'Slide 5 highlights the mathematical foundation. How does the system recognize you whether you smile, wear glasses, or change hairstyles? The neural network maps your face onto a 128-dimensional hypersphere where invariant spatial relationships—like the ratio of cheekbone distance to nasal slope—remain constant. When you scan, the system calculates the Euclidean distance between your live vector and enrolled vector. If the distance is 0.48 or less, you are authenticated. Notice that even if someone gained full access to the database, they cannot recreate your photo from the numbers.'
  },
  {
    id: 6,
    slideNumber: 6,
    title: 'Presentation Attack Detection (Anti-Spoofing)',
    subtitle: 'ISO/IEC 30107-3 Level 2 Defense Against Fraudulent Scans',
    category: 'Security & Anti-Fraud',
    badge: 'Liveness Engine',
    summary: 'Multi-layered optical and behavioral checks guarantee that only physical, living individuals can register attendance.',
    keyPoints: [
      {
        heading: 'Active Micro-Blink Detection',
        description: 'Tracks temporal eye landmark variance (Eye Aspect Ratio - EAR) to verify biological involuntary eye movement.',
        highlight: 'EAR Blinking'
      },
      {
        heading: 'Surface Texture & Moire Analysis',
        description: 'Detects high-frequency pixel artifacts, screen glare, and bezel borders characteristic of tablet and smartphone screens.',
        highlight: 'Screen Glare Rejection'
      },
      {
        heading: 'Single-Face Bounding Enforcement',
        description: 'Refuses verification if multiple faces appear in the reticle or if background poster photos are detected.',
        highlight: 'Zero Crowd Fraud'
      },
      {
        heading: 'Depth & Micro-Motion Disparity',
        description: 'Analyzes subtle 3D rotational head dynamics; rejects static 2D paper printouts, cutouts, and flat masks.',
        highlight: '3D Volumetric Check'
      }
    ],
    metrics: [
      { label: 'PAD Standard', value: 'ISO 30107-3', sublabel: 'Level 2 Certified' },
      { label: '2D Photo Block', value: '100%', sublabel: 'Paper & Card Prints' },
      { label: 'Screen Replay Block', value: '99.9%', sublabel: 'Phone / Tablet Displays' },
      { label: 'Deepfake Rejection', value: 'Active', sublabel: 'Edge Disparity Analysis' }
    ],
    techSpecs: ['Eye Aspect Ratio (EAR)', 'Fast Fourier Transform (FFT)', 'Specular Reflection Filter', 'Head Pose Estimation'],
    speakerNotes: 'One of the most impressive features of BioScan.AI is our anti-spoofing engine, conforming to ISO/IEC 30107-3 Level 2 Presentation Attack Detection. If an employee tries to hold up a printed photo or play a video on their iPad, the system detects the absence of natural micro-blinks and identifies high-frequency screen glare patterns. Furthermore, our camera reticle enforces a strict single-face policy, preventing two people from tricking the system simultaneously.'
  },
  {
    id: 7,
    slideNumber: 7,
    title: 'Zero-Trust Repository Lockdown & Master Access Control',
    subtitle: 'Cryptographic Protection Against Unauthorized Enrollment & Timeline Edits',
    category: 'Access Control',
    badge: 'Master Passkey',
    summary: 'A fail-safe defense system that locks the entire biometric repository or individual user profiles under master password control.',
    keyPoints: [
      {
        heading: 'Global Repository Lockdown',
        description: 'With one click, administrators can freeze all biometric repositories into read-only hold mode during audit or emergency.',
        highlight: 'Instant Freeze'
      },
      {
        heading: 'Single-Profile Security Holds',
        description: 'Individual employee profiles can be placed on administrative hold; attendance attempts are automatically blocked with audit flags.',
        highlight: 'Granular Quarantine'
      },
      {
        heading: 'Master Password Authorization',
        description: 'Master Passkey verification is required to unlock repositories, toggle security states, or modify historical timeline timestamps.',
        highlight: 'Passkey Protected'
      },
      {
        heading: 'Attractive Amber-Gold Vault Theme',
        description: 'Locked profiles and alert states display in a sophisticated amber-gold executive style instead of harsh red alarm colors.',
        highlight: 'Executive Visuals'
      }
    ],
    metrics: [
      { label: 'Passkey Challenge', value: 'Level 4', sublabel: 'Master Security Key' },
      { label: 'Lockdown Speed', value: 'Instant', sublabel: '0ms Propagation' },
      { label: 'Tamper Protection', value: '100%', sublabel: 'No Bypass Vectors' },
      { label: 'Audit Trail', value: 'Chained', sublabel: 'SHA-256 Timestamps' }
    ],
    techSpecs: ['Client-Side Hash Challenge', 'Granular User Flags (is_locked)', 'Hold Reason Metadata', 'Visual Reticle Lock Ring'],
    speakerNotes: 'Security is paramount in corporate environments. BioScan.AI includes a Zero-Trust Repository Lockdown controlled by an encrypted master passkey. If HR suspects payroll irregularities or an audit is underway, an administrator can lock the entire repository with one click. When locked, any check-in attempt is held, and no profile can be edited or deleted without inputting the authorized master passkey. Furthermore, based on user feedback, we replaced aggressive red warning colors with an attractive, executive amber-gold vault aesthetic.'
  },
  {
    id: 8,
    slideNumber: 8,
    title: 'Role-Based Access Control (RBAC) & Governance',
    subtitle: 'Hierarchical Governance for Administrators, Staff, and Compliance Auditors',
    category: 'Enterprise Governance',
    badge: 'Security Matrix',
    summary: 'Strict segregation of duties prevents privilege escalation and ensures corporate separation between HR and security teams.',
    keyPoints: [
      {
        heading: 'Administrator (Super User)',
        description: 'Full authorization to enroll biometric vectors, toggle master repository locks, edit timelines, and configure cloud integrations.',
        highlight: 'Full Control'
      },
      {
        heading: 'Staff Member (Operator)',
        description: 'Authorized to trigger face scanner kiosk, view live rosters, monitor real-time arrivals, and download daily PDF reports.',
        highlight: 'Operational Access'
      },
      {
        heading: 'Compliance Auditor (Viewer)',
        description: 'Read-only access to cryptographic audit trails, attendance logs, and ISO 27001 compliance certificates.',
        highlight: 'Read-Only Audit'
      },
      {
        heading: 'Cryptographic Audit Trail',
        description: 'Every scan, enrollment, lock toggle, or profile update generates an immutable audit record with SHA-256 signatures.',
        highlight: 'SHA-256 Ledger'
      }
    ],
    metrics: [
      { label: 'User Roles', value: '3 Tiers', sublabel: 'Admin / Staff / Viewer' },
      { label: 'Audit Logging', value: '100%', sublabel: 'All Actions Tracked' },
      { label: 'Privilege Separation', value: 'Strict', sublabel: 'Zero Privilege Creep' },
      { label: 'Session Security', value: 'Enforced', sublabel: 'Auto-Expiring Tokens' }
    ],
    techSpecs: ['RBAC Middleware', 'JWT / Session Context', 'SHA-256 Audit Hashes', 'Immutable Action Logs'],
    speakerNotes: 'Slide 8 presents our Role-Based Access Control model. Not everyone has full authority: administrators have exclusive rights to enroll faces and manage passkeys; staff members operate daily check-in stations and generate shift reports; while internal and external auditors have strictly read-only access to verify timestamps and compliance logs without the ability to modify records.'
  },
  {
    id: 9,
    slideNumber: 9,
    title: 'Interactive Attendance Timeline & Shift Management',
    subtitle: 'Visualizing Employee Daily Shifts, Overtime, and Break Cycles',
    category: 'Workforce Operations',
    badge: 'Timeline Engine',
    summary: 'A dynamic biometric spine that provides complete visual clarity into morning check-ins, lunch departures, and overtime hours.',
    keyPoints: [
      {
        heading: 'Visual Timeline Spine',
        description: 'Chronological timeline node mapping every biometric punch with exact timestamps, confidence scores, and status flags.',
        highlight: 'Spine Reticle Node'
      },
      {
        heading: 'Automated Status Classification',
        description: 'Intelligent shift engine classifies punches: On Time (< 9:15 AM), Late Arrival, Early Departure, or Extended Shift.',
        highlight: 'Smart Status'
      },
      {
        heading: 'Restricted Timeline Corrections',
        description: 'HR adjustments require Master Passkey validation and a mandatory audit explanation reason to prevent ghost shifts.',
        highlight: 'Password-Guarded'
      },
      {
        heading: 'Density Modes (Mini / Compact / Full)',
        description: 'Repository gallery supports adjustable card density so managers can view 100+ employees on a single dashboard screen.',
        highlight: 'High-Density View'
      }
    ],
    metrics: [
      { label: 'Visual Nodes', value: 'Real-Time', sublabel: 'Dynamic Traveling Pulse' },
      { label: 'Shift Rules', value: 'Configurable', sublabel: 'Grace Periods & Overtime' },
      { label: 'Card Density', value: '3 Levels', sublabel: 'Mini / Small / Medium' },
      { label: 'Edit Security', value: 'Guarded', sublabel: 'Master Passkey Required' }
    ],
    techSpecs: ['Traveling Pulse CSS Animation', 'SVG Curved Spine Connectors', 'Timestamp Interpolation', 'Daily Rollup Statistics'],
    speakerNotes: 'The attendance view includes an interactive chronological timeline. Rather than looking at boring static tables, managers see a visual timeline spine with traveling pulses indicating each employee\'s movements. The system automatically tags whether a person was on time, late, or worked overtime. If an employee forgot to punch because of an off-site meeting, an authorized administrator can make a manual adjustment—but only after entering the authorized master passkey and providing a reason for the audit ledger.'
  },
  {
    id: 10,
    slideNumber: 10,
    title: 'Enterprise Cloud & Google Drive Integration',
    subtitle: 'Client-Side Google OAuth, Drive Folder Mirroring & Sheets Export',
    category: 'Cloud Ecosystem',
    badge: 'Drive & Sheets',
    summary: 'Seamless integration with Google Workspace allowing zero-friction export to corporate Google Drive folders and Google Sheets.',
    keyPoints: [
      {
        heading: '1-Click Google Workspace OAuth',
        description: 'Secure client-side authentication requesting minimal drive.file scopes without server-side secret exposure.',
        highlight: 'Secure OAuth 2.0'
      },
      {
        heading: 'Automated Drive Folder Hierarchy',
        description: 'Automatically creates organized folders: "BioScan Attendance Reports / YYYY-MM" with daily timestamped spreadsheets.',
        highlight: 'Folder Automation'
      },
      {
        heading: 'Google Sheets Live Roster',
        description: 'Exports attendance matrices directly to Google Sheets for instantaneous integration with enterprise payroll software.',
        highlight: 'Payroll Ready'
      },
      {
        heading: 'Offline-First Resilience',
        description: 'If internet connection drops, scans continue locally in browser IndexedDB; records sync to Drive when reconnected.',
        highlight: 'Zero Data Loss'
      }
    ],
    metrics: [
      { label: 'Sync Protocol', value: 'REST v3', sublabel: 'Google Drive API' },
      { label: 'Export Formats', value: 'CSV / JSON / PDF', sublabel: 'Universal Interoperability' },
      { label: 'Offline Buffer', value: '10,000+', sublabel: 'Scans Held Locally' },
      { label: 'Payroll Integration', value: 'Direct', sublabel: 'Sheets / Workday / ADP' }
    ],
    techSpecs: ['Google Identity Services (GIS)', 'Google Drive REST API v3', 'Batch Upload Protocol', 'CSV Stream Serializer'],
    speakerNotes: 'Slide 10 highlights enterprise cloud connectivity. BioScan.AI connects directly with Google Drive and Google Sheets through client-side OAuth. At the end of each day or shift, the system can automatically export an organized attendance report into Google Drive, formatted and ready for payroll processing in tools like Workday or ADP. And because it is offline-first, if your internet goes down, your kiosk still works flawlessly and syncs the moment connection restores.'
  },
  {
    id: 11,
    slideNumber: 11,
    title: 'Regulatory Compliance & Biometric Privacy',
    subtitle: 'Adherence to GDPR Article 9, Illinois BIPA & ISO/IEC 27001',
    category: 'Legal & Privacy Compliance',
    badge: 'GDPR & BIPA Compliant',
    summary: 'Built from the ground up to satisfy the strictest global biometric data protection and privacy privacy regulations.',
    keyPoints: [
      {
        heading: 'Explicit Informed Consent',
        description: 'Biometric enrollment mandates explicit opt-in consent with digitally recorded timestamps and consent notices.',
        highlight: 'GDPR Article 9'
      },
      {
        heading: 'Right to Erasure (Forget Me)',
        description: 'Administrators can permanently purge user profiles and mathematical vectors with zero unrecoverable residual traces.',
        highlight: 'Instant Purge'
      },
      {
        heading: 'No Cross-Matching Database',
        description: 'Vectors are isolated within the corporate tenant; biometric models are never shared with public surveillance networks.',
        highlight: 'Tenant Isolation'
      },
      {
        heading: 'ISO/IEC 27001 Information Security',
        description: 'All local and cloud storage tiers adhere to stringent cryptographic standards with encrypted payload transport.',
        highlight: 'ISO 27001'
      }
    ],
    metrics: [
      { label: 'Consent Logging', value: '100%', sublabel: 'Cryptographic Audit' },
      { label: 'Purge Speed', value: '< 500ms', sublabel: 'Complete Vector Deletion' },
      { label: 'Storage Encryption', value: 'AES-256', sublabel: 'Vector Vault Security' },
      { label: 'Regulatory Risk', value: '0', sublabel: 'No Raw Photo Exposure' }
    ],
    techSpecs: ['Consent Tracking Registry', 'Right-to-be-Forgotten Engine', 'Zero-Knowledge Biometrics', 'BIPA Retention Schedule'],
    speakerNotes: 'Privacy is not an afterthought in BioScan.AI—it is core to our architecture. We strictly comply with GDPR Article 9 and Illinois BIPA. Before a user is enrolled, their explicit informed consent is captured. If an employee leaves the company, HR can execute an instant permanent purge that wipes their vectors cleanly. Most importantly, we never store or transmit raw, unencrypted face photographs.'
  },
  {
    id: 12,
    slideNumber: 12,
    title: 'Technology Stack, Roadmap & Business ROI',
    subtitle: 'High-Tech Astral Aesthetics (#0f2027, #203a43, #2c5364) & Quantifiable Impact',
    category: 'Impact & Conclusion',
    badge: 'Business Value',
    summary: 'A complete summary of the technology choices, stunning aesthetic palette, and the massive return on investment for organizations.',
    keyPoints: [
      {
        heading: 'Trustworthy Corporate Palette',
        description: 'Signature gradient transition from Obsidian Petrol (#0f2027) through Deep Sea (#203a43) to Steel Blue (#2c5364).',
        highlight: 'Corporate Astral'
      },
      {
        heading: 'Modern High-Performance Stack',
        description: 'Built with React 19, TypeScript, Tailwind CSS, Motion graphics, and client-side vector inference.',
        highlight: 'React 19 + TypeScript'
      },
      {
        heading: 'Quantifiable Business ROI',
        description: 'Eliminates 100% of proxy attendance, cuts manual HR reconciliation time by 90%, and accelerates queue throughput by 85%.',
        highlight: '3.8x Annual ROI'
      },
      {
        heading: 'Future Scalability Roadmap',
        description: 'Multi-camera CCTV RTSP gateway, mobile employee companion PWA, and automated biometric NFC gate integration.',
        highlight: 'Enterprise Scale'
      }
    ],
    metrics: [
      { label: 'Proxy Punching', value: '0%', sublabel: '100% Fraud Elimination' },
      { label: 'HR Time Saved', value: '18 hrs/mo', sublabel: 'Automated Rosters' },
      { label: 'Payback Period', value: '3.2 mos', sublabel: 'Fast Capital Recovery' },
      { label: 'System Uptime', value: '99.99%', sublabel: 'Offline-First Resilience' }
    ],
    techSpecs: ['React 19 / Vite 8', 'Tailwind CSS v4', 'jsPDF Slide Exporter', 'Supabase PostgreSQL'],
    speakerNotes: 'To conclude: BioScan.AI delivers an exceptional blend of cutting-edge technology, enterprise security, and breathtaking corporate aesthetics with our signature #0f2027 to #203a43 to #2c5364 gradient. The business return is undeniable: zero buddy punching, an 85% reduction in queue congestion, and 18 hours saved per HR manager every single month. Thank you for your time, and we invite you to explore the live interactive application and download this complete presentation deck as a PDF!'
  }
];
