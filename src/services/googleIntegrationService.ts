/**
 * Old Alexandra Hockey Club Coaching Hub
 * Google Integration Service (Gmail & Google Drive)
 * Specially tailored for Richard Couse (richardcouse7@gmail.com)
 */

import { GoogleAuthStatus, GoogleDriveBackupFile } from '../types';

export const AUTHORIZED_DIRECTOR_EMAIL = 'richardcouse7@gmail.com';
export const DRIVE_FOLDER_NAME = 'Old Alex Coaching Hub';

const STORAGE_KEYS = {
  CLIENT_ID: 'oldalex_google_client_id',
  ACCESS_TOKEN: 'oldalex_google_access_token',
  EXPIRES_AT: 'oldalex_google_expires_at',
  USER_PROFILE: 'oldalex_google_user_profile',
  DRIVE_FOLDER_ID: 'oldalex_google_drive_folder_id',
};

// Default Google OAuth Scopes:
// - drive.file: Per-file access (safe, only files created by this app)
// - gmail.compose: Create drafts & send emails from Richard's Gmail
// - userinfo.email & profile: Verify Richard Couse's identity
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

// In-memory script loader promise
let gisScriptLoadedPromise: Promise<boolean> | null = null;

function loadGisScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2) return Promise.resolve(true);
  if (gisScriptLoadedPromise) return gisScriptLoadedPromise;

  gisScriptLoadedPromise = new Promise((resolve) => {
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return gisScriptLoadedPromise;
}

// Convert string to base64url for RFC 2822 Gmail API
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const GoogleIntegrationService = {
  // =========================================================================
  // 1. CONFIGURATION & AUTHENTICATION STATE
  // =========================================================================

  getClientId(): string {
    return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '';
  },

  setClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  },

  getAuthStatus(): GoogleAuthStatus {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || 0);
    const isExpired = Date.now() > expiresAt;

    let profile: { email?: string; name?: string; picture?: string } = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (raw) profile = JSON.parse(raw);
    } catch {
      // ignore parse error
    }

    const isSignedIn = Boolean(token && !isExpired);

    return {
      isSignedIn,
      accessToken: isSignedIn ? token : null,
      expiresAt: isSignedIn ? expiresAt : null,
      userEmail: profile.email || (isSignedIn ? AUTHORIZED_DIRECTOR_EMAIL : null),
      userName: profile.name || (isSignedIn ? 'Richard Couse' : null),
      userPicture: profile.picture || null,
    };
  },

  isAuthorizedDirector(): boolean {
    const status = this.getAuthStatus();
    if (!status.isSignedIn) return false;
    return (
      !status.userEmail ||
      status.userEmail.toLowerCase() === AUTHORIZED_DIRECTOR_EMAIL.toLowerCase()
    );
  },

  signOut(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
  },

  /**
   * Triggers the Google OAuth 2.0 Consent popup for Richard Couse
   */
  async requestToken(): Promise<GoogleAuthStatus> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error(
        'Please enter your Google Cloud OAuth Client ID first. See the 2-minute setup instructions below.'
      );
    }

    const loaded = await loadGisScript();
    if (!loaded || !window.google?.accounts?.oauth2) {
      throw new Error(
        'Could not load Google Identity Services. Check your internet connection or pitchside offline mode.'
      );
    }

    return new Promise((resolve, reject) => {
      try {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) {
          reject(new Error('Google Identity Services library not available.'));
          return;
        }

        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_SCOPES,
          hint: AUTHORIZED_DIRECTOR_EMAIL,
          callback: async (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            const token = response.access_token || '';
            const expiresIn = Number(response.expires_in || 3600);
            const expiresAt = Date.now() + expiresIn * 1000;

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));

            // Fetch profile
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const profile = await res.json();
                localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
              }
            } catch {
              // Non-fatal profile fetch
            }

            resolve(GoogleIntegrationService.getAuthStatus());
          },
        });

        client.requestAccessToken({ prompt: '' });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  },

  // =========================================================================
  // 2. GMAIL INTEGRATION (Zero-Setup Web Compose & Direct Gmail API)
  // =========================================================================

  /**
   * Generates a direct web URL to compose in Richard's logged-in Gmail.
   * Works instantly with zero setup or API credentials!
   */
  getDirectGmailComposeUrl(params: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
  }): string {
    const url = new URL('https://mail.google.com/mail/');
    url.searchParams.set('view', 'cm');
    url.searchParams.set('fs', '1');
    if (params.to) url.searchParams.set('to', params.to);
    if (params.subject) url.searchParams.set('su', params.subject);
    if (params.body) url.searchParams.set('body', params.body);
    if (params.cc) url.searchParams.set('cc', params.cc);
    if (params.bcc) url.searchParams.set('bcc', params.bcc);
    return url.toString();
  },

  /**
   * Launches direct Gmail Web compose in a new browser window
   */
  openDirectGmail(params: {
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
  }): void {
    const url = this.getDirectGmailComposeUrl(params);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Sends or creates a draft email directly through the Gmail API
   */
  async sendViaGmailApi(params: {
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
    asDraft?: boolean;
  }): Promise<{ id: string; threadId?: string; isDraft: boolean }> {
    const auth = this.getAuthStatus();
    if (!auth.isSignedIn || !auth.accessToken) {
      throw new Error('Not signed into Google. Please connect your Google account first.');
    }

    const boundary = `====_NextPart_${Date.now()}_====`;
    const fromName = 'Richard Couse (Old Alex Coaching Director)';
    const fromEmail = auth.userEmail || AUTHORIZED_DIRECTOR_EMAIL;

    let mimeMessage = '';
    mimeMessage += `From: ${fromName} <${fromEmail}>\r\n`;
    mimeMessage += `To: ${params.to}\r\n`;
    mimeMessage += `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=\r\n`;
    mimeMessage += `MIME-Version: 1.0\r\n`;

    if (params.bodyHtml) {
      mimeMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n`;
      mimeMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      mimeMessage += `${params.bodyText}\r\n\r\n`;
      mimeMessage += `--${boundary}\r\n`;
      mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
      mimeMessage += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      mimeMessage += `${params.bodyHtml}\r\n\r\n`;
      mimeMessage += `--${boundary}--\r\n`;
    } else {
      mimeMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
      mimeMessage += params.bodyText;
    }

    const raw = base64UrlEncode(mimeMessage);

    const endpoint = params.asDraft
      ? 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
      : 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

    const payload = params.asDraft ? { message: { raw } } : { raw };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `Gmail API request failed with status ${res.status}`
      );
    }

    const data = await res.json();
    return {
      id: data.id,
      threadId: data.threadId || data.message?.threadId,
      isDraft: Boolean(params.asDraft),
    };
  },

  // =========================================================================
  // 3. GOOGLE DRIVE INTEGRATION (Backups & Folders)
  // =========================================================================

  /**
   * Locates or creates the dedicated "Old Alex Coaching Hub" folder in Richard's Drive
   */
  async getOrCreateDriveFolder(): Promise<string> {
    const auth = this.getAuthStatus();
    if (!auth.isSignedIn || !auth.accessToken) {
      throw new Error('Not signed into Google Drive. Please authenticate first.');
    }

    // Check cached folder ID
    const cachedId = localStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    if (cachedId) {
      // Verify it still exists
      try {
        const verifyRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,name,trashed`,
          {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          }
        );
        if (verifyRes.ok) {
          const folder = await verifyRes.json();
          if (!folder.trashed) return cachedId;
        }
      } catch {
        // Continue to search/create
      }
    }

    // Search for existing folder
    const query = `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const folderId = data.files[0].id;
        localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, folderId);
        return folderId;
      }
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Drive folder.');
    }

    const created = await createRes.json();
    localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, created.id);
    return created.id;
  },

  /**
   * Uploads a file directly to Richard's "Old Alex Coaching Hub" folder
   */
  async uploadFileToDrive(options: {
    filename: string;
    mimeType: string;
    content: string;
  }): Promise<GoogleDriveBackupFile> {
    const auth = this.getAuthStatus();
    if (!auth.isSignedIn || !auth.accessToken) {
      throw new Error('Not signed into Google Drive. Please authenticate first.');
    }

    const folderId = await this.getOrCreateDriveFolder();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: options.filename,
      mimeType: options.mimeType,
      parents: [folderId],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${options.mimeType}\r\n\r\n` +
      options.content +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive upload failed with status ${res.status}`);
    }

    return await res.json();
  },

  /**
   * 1-Tap Director Vault Backup to Google Drive
   */
  async backupVaultToDrive(vaultData: unknown): Promise<GoogleDriveBackupFile> {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `oldalex_hub_vault_backup_${dateStr}.json`;
    const content = JSON.stringify(vaultData, null, 2);

    return await this.uploadFileToDrive({
      filename,
      mimeType: 'application/json',
      content,
    });
  },

  /**
   * Lists all JSON backups stored in the "Old Alex Coaching Hub" folder on Google Drive
   */
  async listBackupsFromDrive(): Promise<GoogleDriveBackupFile[]> {
    const auth = this.getAuthStatus();
    if (!auth.isSignedIn || !auth.accessToken) {
      throw new Error('Not signed into Google Drive.');
    }

    const folderId = await this.getOrCreateDriveFolder();
    const query = `'${folderId}' in parents and mimeType = 'application/json' and trashed = false`;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&orderBy=createdTime desc&fields=files(id,name,createdTime,size,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to list Google Drive backups.');
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Downloads and parses a backup file from Google Drive
   */
  async downloadBackupContent(fileId: string): Promise<unknown> {
    const auth = this.getAuthStatus();
    if (!auth.isSignedIn || !auth.accessToken) {
      throw new Error('Not signed into Google Drive.');
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to download backup from Google Drive (HTTP ${res.status}).`);
    }

    return await res.json();
  },
};

// Augment window object for Google GIS library
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            hint?: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}
