import axios from 'axios';

// Use environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large files
});

// Helper function to trigger file download
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// PDF Operations
export const mergePDFs = async (files, onUploadProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/api/process/merge-pdf', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response;
};

export const splitPDF = async (file, pageRanges, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pageRanges', pageRanges);

  const response = await api.post('/api/process/split-pdf', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response;
};

export const getPDFInfo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/process/pdf-info', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Image Operations
export const compressImage = async (file, quality, onUploadProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('quality', quality);

  const response = await api.post('/api/process/compress-image', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response;
};

export const resizeImage = async (file, width, height, quality, onUploadProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  if (width) formData.append('width', width);
  if (height) formData.append('height', height);
  formData.append('quality', quality);

  const response = await api.post('/api/process/resize-image', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response;
};

export const convertImage = async (file, format, quality, onUploadProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('format', format);
  formData.append('quality', quality);

  const response = await api.post('/api/process/convert-image', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });

  return response;
};

export default api;
