import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken 
} from '../lib/googleAuth';
import { 
  DriveFile, 
  DriveAboutInfo, 
  getDriveAbout, 
  listDriveFiles, 
  getOrCreateAppFolder, 
  syncAttendanceToDrive, 
  syncRosterToDrive,
  deleteDriveFile
} from '../lib/googleDrive';
import { AttendanceRecord, EnrolledUser } from '../types';

interface GoogleDriveContextType {
  user: User | null;
  accessToken: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  aboutInfo: DriveAboutInfo | null;
  files: DriveFile[];
  appFolder: DriveFile | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshDrive: () => Promise<void>;
  syncAttendance: (records: AttendanceRecord[]) => Promise<DriveFile>;
  syncRoster: (users: EnrolledUser[]) => Promise<DriveFile>;
  deleteFile: (fileId: string) => Promise<void>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [appFolder, setAppFolder] = useState<DriveFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!user && !!accessToken;

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authenticatedUser, token) => {
        setUser(authenticatedUser);
        setAccessToken(token);
        setIsLoading(false);
        loadDriveData(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setAboutInfo(null);
        setFiles([]);
        setAppFolder(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadDriveData = async (token?: string) => {
    const currentToken = token || (await getAccessToken());
    if (!currentToken) return;

    try {
      setError(null);
      const [about, folder] = await Promise.all([
        getDriveAbout().catch(err => {
          console.warn('Could not load Drive about info:', err);
          return null;
        }),
        getOrCreateAppFolder().catch(err => {
          console.warn('Could not locate/create app folder:', err);
          return null;
        }),
      ]);

      if (about) setAboutInfo(about);
      if (folder) {
        setAppFolder(folder);
        const folderFiles = await listDriveFiles(folder.id).catch(() => []);
        setFiles(folderFiles);
      }
    } catch (err: any) {
      console.error('Failed to load Google Drive content:', err);
      setError(err?.message || 'Error loading Google Drive');
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await loadDriveData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setError(err?.message || 'Sign in with Google failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setAboutInfo(null);
      setFiles([]);
      setAppFolder(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
      setError(err?.message || 'Sign out failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDrive = async () => {
    setIsLoading(true);
    await loadDriveData();
    setIsLoading(false);
  };

  const syncAttendance = async (records: AttendanceRecord[]): Promise<DriveFile> => {
    setIsSyncing(true);
    setError(null);
    try {
      const folderId = appFolder?.id;
      const uploadedFile = await syncAttendanceToDrive(records, folderId);
      // Refresh file list
      if (folderId) {
        const updated = await listDriveFiles(folderId);
        setFiles(updated);
      }
      return uploadedFile;
    } catch (err: any) {
      console.error('Attendance Drive sync failed:', err);
      setError(err?.message || 'Failed to sync attendance to Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncRoster = async (users: EnrolledUser[]): Promise<DriveFile> => {
    setIsSyncing(true);
    setError(null);
    try {
      const folderId = appFolder?.id;
      const uploadedFile = await syncRosterToDrive(users, folderId);
      // Refresh file list
      if (folderId) {
        const updated = await listDriveFiles(folderId);
        setFiles(updated);
      }
      return uploadedFile;
    } catch (err: any) {
      console.error('Roster Drive sync failed:', err);
      setError(err?.message || 'Failed to sync roster to Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    setError(null);
    try {
      await deleteDriveFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      console.error('Failed to delete file from Drive:', err);
      setError(err?.message || 'Failed to delete file from Google Drive');
      throw err;
    }
  };

  return (
    <GoogleDriveContext.Provider
      value={{
        user,
        accessToken,
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
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
