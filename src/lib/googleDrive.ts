import { getAccessToken } from './googleAuth';
import { AttendanceRecord, EnrolledUser } from '../types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
}

export interface DriveAboutInfo {
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
  limit?: number;
  usage?: number;
  usageInDrive?: number;
}

const SIMULATED_FILES_KEY = 'bioscan_simulated_drive_files_v1';

function getSimulatedFilesStore(): Array<DriveFile & { content?: string }> {
  try {
    const raw = localStorage.getItem(SIMULATED_FILES_KEY);
    if (!raw) {
      const initial: Array<DriveFile & { content?: string }> = [
        {
          id: 'sim_file_001',
          name: 'BioScan_Attendance_Sync_20260321_1000.csv',
          mimeType: 'text/csv',
          size: '14320',
          createdTime: new Date(Date.now() - 3600000).toISOString(),
          modifiedTime: new Date(Date.now() - 3600000).toISOString(),
          webViewLink: 'https://drive.google.com',
          parents: ['simulated_folder_bioscan_root'],
        },
        {
          id: 'sim_file_002',
          name: 'BioScan_Enrolled_Roster_Backup.json',
          mimeType: 'application/json',
          size: '28600',
          createdTime: new Date(Date.now() - 7200000).toISOString(),
          modifiedTime: new Date(Date.now() - 7200000).toISOString(),
          webViewLink: 'https://drive.google.com',
          parents: ['simulated_folder_bioscan_root'],
        },
      ];
      localStorage.setItem(SIMULATED_FILES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSimulatedFilesStore(files: Array<DriveFile & { content?: string }>) {
  localStorage.setItem(SIMULATED_FILES_KEY, JSON.stringify(files));
}

/**
 * Helper to ensure valid access token exists
 */
async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token not found. Please sign in with Google first.');
  }
  return token;
}

/**
 * Get user information and Drive storage quota
 */
export async function getDriveAbout(): Promise<DriveAboutInfo> {
  const token = await requireToken();
  if (token.startsWith('simulated_')) {
    return {
      userName: 'Sahil Verma',
      userEmail: 'sahilverma8085784943@gmail.com',
      userPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      limit: 15 * 1024 * 1024 * 1024,
      usage: 4.8 * 1024 * 1024 * 1024,
      usageInDrive: 1.2 * 1024 * 1024 * 1024,
    };
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Drive account information.');
  }

  const data = await res.json();
  return {
    userName: data.user?.displayName,
    userEmail: data.user?.emailAddress,
    userPhoto: data.user?.photoLink,
    limit: data.storageQuota?.limit ? parseInt(data.storageQuota.limit, 10) : undefined,
    usage: data.storageQuota?.usage ? parseInt(data.storageQuota.usage, 10) : undefined,
    usageInDrive: data.storageQuota?.usageInDrive ? parseInt(data.storageQuota.usageInDrive, 10) : undefined,
  };
}

/**
 * List files in Google Drive
 */
export async function listDriveFiles(
  folderId?: string,
  searchQuery?: string
): Promise<DriveFile[]> {
  const token = await requireToken();
  if (token.startsWith('simulated_')) {
    let files = getSimulatedFilesStore();
    if (folderId) {
      files = files.filter(f => !f.parents || f.parents.includes(folderId));
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      files = files.filter(f => f.name.toLowerCase().includes(q));
    }
    return files;
  }

  const queries: string[] = ['trashed = false'];
  if (folderId) {
    queries.push(`'${folderId}' in parents`);
  }
  if (searchQuery && searchQuery.trim()) {
    queries.push(`name contains '${searchQuery.replace(/'/g, "\\'")}'`);
  }

  const q = encodeURIComponent(queries.join(' and '));
  const fields = encodeURIComponent(
    'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents)'
  );

  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Drive files.');
  }

  const data = await res.json();
  return (data.files || []) as DriveFile[];
}

/**
 * Find or create the application root folder "BioScan Attendance" in Google Drive
 */
export async function getOrCreateAppFolder(folderName = 'BioScan Attendance'): Promise<DriveFile> {
  const token = await requireToken();
  if (token.startsWith('simulated_')) {
    return {
      id: 'simulated_folder_bioscan_root',
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      webViewLink: 'https://drive.google.com',
    };
  }

  // Search if folder already exists in root
  const q = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id, name, mimeType, webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0];
    }
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Dedicated cloud directory for BioScan biometric attendance logs and backups.',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create BioScan folder in Google Drive.');
  }

  return await createRes.json();
}

/**
 * Upload file to Google Drive using multipart upload
 */
export async function uploadFileToDrive({
  name,
  mimeType,
  content,
  folderId,
}: {
  name: string;
  mimeType: string;
  content: string | Blob;
  folderId?: string;
}): Promise<DriveFile> {
  const token = await requireToken();

  let bodyContent = '';
  if (content instanceof Blob) {
    bodyContent = await content.text();
  } else {
    bodyContent = content;
  }

  if (token.startsWith('simulated_')) {
    const newFile: DriveFile & { content?: string } = {
      id: `sim_file_${Date.now()}`,
      name,
      mimeType,
      size: String(new Blob([bodyContent]).size),
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      webViewLink: 'https://drive.google.com',
      parents: folderId ? [folderId] : ['simulated_folder_bioscan_root'],
      content: bodyContent,
    };
    const store = getSimulatedFilesStore();
    store.unshift(newFile);
    saveSimulatedFilesStore(store);
    return newFile;
  }

  const metadata: any = {
    name,
    mimeType,
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    bodyContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive.');
  }

  return await res.json();
}

/**
 * Download file content from Google Drive
 */
export async function downloadDriveFile(fileId: string): Promise<string> {
  const token = await requireToken();
  if (token.startsWith('simulated_')) {
    const store = getSimulatedFilesStore();
    const found = store.find(f => f.id === fileId);
    return found?.content || 'Mock content for simulated file';
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to download file from Google Drive.');
  }

  return await res.text();
}

/**
 * Delete a file or folder from Google Drive.
 * (MUST be called only after user confirmation in UI)
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await requireToken();
  if (token.startsWith('simulated_')) {
    const store = getSimulatedFilesStore().filter(f => f.id !== fileId);
    saveSimulatedFilesStore(store);
    return;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive.');
  }
}

/**
 * Export attendance records directly to Google Drive
 */
export async function syncAttendanceToDrive(
  records: AttendanceRecord[],
  targetFolderId?: string
): Promise<DriveFile> {
  const now = new Date();
  const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const fileName = `BioScan_Attendance_Sync_${dateTag}.csv`;

  const headers = [
    'Attendance ID',
    'User ID',
    'Full Name',
    'Roll Number',
    'Department',
    'Attendance Date',
    'Check-in Time',
    'Confidence Score',
    'Method',
    'Verified By',
  ];

  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.user_id}"`,
    `"${r.user_name || ''}"`,
    `"${r.user_roll || ''}"`,
    `"${r.department || ''}"`,
    `"${r.attendance_date}"`,
    `"${r.check_in_at}"`,
    `"${(r.confidence_score * 100).toFixed(1)}%"`,
    `"${r.method}"`,
    `"${r.verified_by_name || 'Auto-Verified'}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  let folderId = targetFolderId;
  if (!folderId) {
    const appFolder = await getOrCreateAppFolder();
    folderId = appFolder.id;
  }

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'text/csv',
    content: csv,
    folderId,
  });
}

/**
 * Export enrolled user roster directly to Google Drive
 */
export async function syncRosterToDrive(
  users: EnrolledUser[],
  targetFolderId?: string
): Promise<DriveFile> {
  const now = new Date();
  const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const fileName = `BioScan_Enrolled_Roster_${dateTag}.csv`;

  const headers = [
    'ID',
    'Full Name',
    'Roll Number',
    'Email',
    'Phone',
    'Department',
    'Role',
    'Status',
    'Vector Dimension',
    'Consent Date',
    'Enrolled Date',
  ];

  const rows = users.map(u => [
    `"${u.id}"`,
    `"${u.full_name}"`,
    `"${u.roll_number || ''}"`,
    `"${u.email || ''}"`,
    `"${u.phone || ''}"`,
    `"${u.department || ''}"`,
    `"${u.user_role}"`,
    `"${u.is_active ? 'Active' : 'Inactive'}"`,
    `"${u.face_descriptor?.length || 0}"`,
    `"${u.consent_at || ''}"`,
    `"${u.created_at}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  let folderId = targetFolderId;
  if (!folderId) {
    const appFolder = await getOrCreateAppFolder();
    folderId = appFolder.id;
  }

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'text/csv',
    content: csv,
    folderId,
  });
}
