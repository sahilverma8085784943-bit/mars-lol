import React, { useState } from 'react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { AttendanceRecord, EnrolledUser } from '../types';
import { 
  HardDrive, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Trash2, 
  FileText, 
  Users, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Folder, 
  Info,
  LogOut,
  Search
} from 'lucide-react';
import { uploadFileToDrive } from '../lib/googleDrive';

interface GoogleDriveViewProps {
  attendanceRecords: AttendanceRecord[];
  enrolledUsers: EnrolledUser[];
  onShowToast: (msg: string) => void;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({
  attendanceRecords,
  enrolledUsers,
  onShowToast,
}) => {
  const {
    user,
    isConnected,
    isLoading,
    isSyncing,
    aboutInfo,
    files,
    appFolder,
    error,
    signIn,
    signOut,
    refreshDrive,
    syncAttendance,
    syncRoster,
    deleteFile,
  } = useGoogleDrive();

  const [searchQuery, setSearchQuery] = useState('');
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingCustom, setUploadingCustom] = useState(false);

  const handleSyncAttendance = async () => {
    try {
      const file = await syncAttendance(attendanceRecords);
      onShowToast(`Synced ${attendanceRecords.length} attendance records to Google Drive (${file.name})`);
    } catch (err: any) {
      // Error handled in context
    }
  };

  const handleSyncRoster = async () => {
    try {
      const file = await syncRoster(enrolledUsers);
      onShowToast(`Synced ${enrolledUsers.length} enrolled users to Google Drive (${file.name})`);
    } catch (err: any) {
      // Error handled in context
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFile(fileToDelete.id);
      onShowToast(`Permanently removed "${fileToDelete.name}" from Google Drive`);
      setFileToDelete(null);
    } catch (err) {
      // Error handled in context
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appFolder) return;

    setUploadingCustom(true);
    try {
      const text = await file.text();
      await uploadFileToDrive({
        name: file.name,
        mimeType: file.type || 'text/plain',
        content: text,
        folderId: appFolder.id,
      });
      await refreshDrive();
      onShowToast(`Uploaded "${file.name}" to Google Drive`);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingCustom(false);
      e.target.value = '';
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format bytes
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Hero */}
      <div 
        className="p-6 rounded-2xl border relative overflow-hidden" 
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <h1 className="text-xl font-bold">Google Drive Cloud Storage &amp; Sync</h1>
              {isConnected && (
                <span className="px-2 py-0.5 rounded text-[11px] mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CONNECTED
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Securely archive biometric attendance spreadsheets, roster backups, and photo archives directly into your Google Drive.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <button
                  onClick={refreshDrive}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 hover:opacity-80 transition-opacity"
                  style={{ borderColor: 'var(--line)' }}
                  title="Refresh Drive Files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <div>
                {/* Official Google Sign-In Button */}
                <button 
                  onClick={signIn}
                  disabled={isLoading}
                  className="gsi-material-button"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        /* Unauthenticated State */
        <div 
          className="p-10 rounded-2xl border text-center space-y-5"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div 
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border"
            style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
          >
            <Cloud className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-base font-bold">Connect Google Drive to BioScan</h2>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Sign in with your Google Account to authorize BioScan to create and manage dedicated attendance archives, sync daily verification sheets, and store encrypted biometric backups.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button 
              onClick={signIn}
              disabled={isLoading}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          </div>

          <div className="pt-6 border-t max-w-lg mx-auto text-[11px] space-y-1.5" style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}>
            <div className="flex items-center justify-center space-x-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Scoped OAuth Access</span>
            </div>
            <p>
              BioScan requests access only to sync and manage files within your authorized Google Drive workspace. Your tokens are strictly held in memory and never stored in cookies or local storage.
            </p>
          </div>
        </div>
      ) : (
        /* Connected State */
        <div className="space-y-6">
          
          {/* User Account & Folder Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Account Card */}
            <div className="p-4 rounded-2xl border flex items-center space-x-3.5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Google User'} className="w-11 h-11 rounded-full border" style={{ borderColor: 'var(--accent)' }} />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center border font-bold text-sm" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  {user?.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div className="overflow-hidden">
                <span className="text-xs font-bold block truncate">{user?.displayName || 'Google User'}</span>
                <span className="text-[11px] mono block truncate" style={{ color: 'var(--text-dim)' }}>{user?.email}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Google Workspace Active</span>
              </div>
            </div>

            {/* Folder Card */}
            <div className="p-4 rounded-2xl border space-y-1.5" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center space-x-1.5">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <span>Drive Destination</span>
                </span>
                {appFolder?.webViewLink && (
                  <a 
                    href={appFolder.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs font-mono font-semibold truncate" style={{ color: 'var(--text)' }}>
                My Drive / {appFolder?.name || 'BioScan Attendance'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Dedicated folder created for all automated syncs and backups.
              </p>
            </div>

            {/* Storage Quota Card */}
            <div className="p-4 rounded-2xl border space-y-2" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
              <span className="text-xs font-bold flex items-center justify-between">
                <span>Google Drive Storage</span>
                <span className="mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  {aboutInfo?.limit ? `${formatBytes(aboutInfo.usage)} / ${formatBytes(aboutInfo.limit)}` : 'Available'}
                </span>
              </span>

              {aboutInfo?.limit && aboutInfo?.usage !== undefined && (
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (aboutInfo.usage / aboutInfo.limit) * 100)}%` }}
                  />
                </div>
              )}

              <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                Current usage across your personal or organizational Google Drive.
              </p>
            </div>
          </div>

          {/* Sync Operations Action Bar */}
          <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <h2 className="text-sm font-bold flex items-center space-x-2">
              <CloudCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>Instant Cloud Sync Operations</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Sync Attendance */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Attendance Records</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    Export {attendanceRecords.length} records into a formatted timestamped CSV on Drive.
                  </p>
                </div>

                <button
                  onClick={handleSyncAttendance}
                  disabled={isSyncing}
                  className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: 'var(--accent)', color: '#0a0e13' }}
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Uploading...' : 'Sync Attendance to Drive'}</span>
                </button>
              </div>

              {/* Sync Roster */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Enrolled Users Roster</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    Export roster of {enrolledUsers.length} enrolled faces and registration metadata.
                  </p>
                </div>

                <button
                  onClick={handleSyncRoster}
                  disabled={isSyncing}
                  className="w-full py-2 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Uploading...' : 'Sync Roster to Drive'}</span>
                </button>
              </div>

              {/* Upload Any File */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Upload Custom File</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                    Upload any local spreadsheet, snapshot photo, or log directly to the BioScan folder.
                  </p>
                </div>

                <label 
                  className="w-full py-2 rounded-lg text-xs font-bold border flex items-center justify-center space-x-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-center"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingCustom ? 'Uploading...' : 'Choose File to Upload'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleCustomUpload}
                    disabled={uploadingCustom}
                  />
                </label>
              </div>

            </div>
          </div>

          {/* Drive File Explorer */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
            <div className="p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--line)' }}>
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <span>Files in BioScan Attendance Folder ({filteredFiles.length})</span>
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Cloud-synced files stored inside your connected Google Drive
                </p>
              </div>

              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search Drive files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-transparent text-xs"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Cloud className="w-8 h-8 mx-auto" style={{ color: 'var(--text-dim)' }} />
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {searchQuery ? 'No files match your search.' : 'No files in this folder yet. Click "Sync Attendance to Drive" above to create your first cloud backup!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b mono uppercase text-[10px]" style={{ borderColor: 'var(--line)', background: 'var(--bg)', color: 'var(--text-dim)' }}>
                    <tr>
                      <th className="p-3.5 pl-5">File Name</th>
                      <th className="p-3.5">Size</th>
                      <th className="p-3.5">Last Modified</th>
                      <th className="p-3.5 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3.5 pl-5 font-medium flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
                        </td>
                        <td className="p-3.5 mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
                          {file.size ? formatBytes(parseInt(file.size, 10)) : '—'}
                        </td>
                        <td className="p-3.5 mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : '—'}
                        </td>
                        <td className="p-3.5 pr-5 text-right space-x-2">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md border text-[11px] font-semibold inline-flex items-center space-x-1 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                              style={{ borderColor: 'var(--line)' }}
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open</span>
                            </a>
                          )}

                          {/* Delete Button with Mandatory User Confirmation */}
                          <button
                            onClick={() => setFileToDelete({ id: file.id, name: file.name })}
                            className="px-2.5 py-1 rounded-md border text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center space-x-1"
                            style={{ borderColor: 'rgba(244, 63, 94, 0.25)' }}
                            title="Delete from Google Drive"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Destructive Delete Operations */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{ background: 'var(--panel)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
          >
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Confirm Drive File Deletion</h3>
                <p className="text-xs text-rose-300/80">Destructive operation on Google Drive</p>
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--text)' }}>
              Are you sure you want to permanently delete <strong className="font-semibold text-white">"{fileToDelete.name}"</strong> from your Google Drive? This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--line)' }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
