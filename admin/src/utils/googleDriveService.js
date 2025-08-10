// Google Drive API Service
// This service handles image uploads and downloads to Google Drive

const CLIENT_ID = '557355325183-som7qhn9p4fo3hg8475h2t50l8k9gv3i.apps.googleusercontent.com';
const API_KEY = 'AIzaSyCNlCXRk1r3tR5o6cjdrt55P66gButp87M';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
  }

  /**
   * Initialize the Google Drive API client
   */
  async init() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          }).then(() => {
            this.isInitialized = true;
            resolve();
          }).catch(reject);
        });
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Check if user is signed in
   */
  isSignedIn() {
    if (!this.isInitialized) return false;
    return window.gapi.auth2.getAuthInstance().isSignedIn.get();
  }

  /**
   * Sign in to Google
   */
  async signIn() {
    if (!this.isInitialized) await this.init();
    return window.gapi.auth2.getAuthInstance().signIn();
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    if (!this.isInitialized) return;
    return window.gapi.auth2.getAuthInstance().signOut();
  }

  /**
   * Upload file to Google Drive
   * @param {File} file - The file to upload
   * @param {string} folderId - Optional folder ID to upload to
   * @returns {Promise<string>} - File ID of uploaded file
   */
  async uploadFile(file, folderId = null) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${window.gapi.auth.getToken().access_token}`,
        }),
        body: form,
      });

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download file from Google Drive
   * @param {string} fileId - The ID of the file to download
   * @returns {Promise<string>} - URL of the file
   */
  async downloadFile(fileId) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${window.gapi.auth.getToken().access_token}`,
        },
      });

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get file URL (for embedding images)
   * @param {string} fileId - The ID of the file
   * @returns {Promise<string>} - Direct URL to the file
   */
  async getFileUrl(fileId) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    try {
      // Make file publicly accessible
      await window.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Return the direct URL
      return `https://drive.google.com/uc?id=${fileId}`;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * List files in a folder
   * @param {string} folderId - The ID of the folder
   * @returns {Promise<Array>} - Array of file objects
   */
  async listFiles(folderId = null) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    let query = "trashed=false";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    try {
      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink)',
      });
      return response.result.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Create a folder in Google Drive
   * @param {string} folderName - Name of the folder
   * @param {string} parentFolderId - Optional parent folder ID
   * @returns {Promise<string>} - Folder ID
   */
  async createFolder(folderName, parentFolderId = null) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      folderMetadata.parents = [parentFolderId];
    }

    try {
      const response = await window.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });
      return response.result.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Google Drive
   * @param {string} fileId - The ID of the file to delete
   */
  async deleteFile(fileId) {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    try {
      await window.gapi.client.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService;

// Usage example:
/*
import googleDriveService from './googleDriveService';

// Initialize
await googleDriveService.init();

// Upload an image
const fileId = await googleDriveService.uploadFile(imageFile);

// Get the URL
const imageUrl = await googleDriveService.getFileUrl(fileId);

// Download an image
const downloadUrl = await googleDriveService.downloadFile(fileId);
*/
