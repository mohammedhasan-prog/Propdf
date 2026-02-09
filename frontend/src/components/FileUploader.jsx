import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUploader = ({ onFilesSelected, accept, multiple = true, maxFiles = 20, label }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'upload-zone-active' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center
              transition-all duration-300
              ${isDragActive 
                ? 'bg-indigo-500/20 scale-110' 
                : 'bg-white/5'
              }
            `}>
              <svg 
                className={`w-10 h-10 transition-all duration-300 ${
                  isDragActive 
                    ? 'text-indigo-400 animate-bounce' 
                    : 'text-slate-400'
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div>
            {isDragActive ? (
              <p className="text-xl font-semibold text-indigo-400 animate-pulse">
                Drop files here...
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-white mb-2">
                  {label || 'Drag & drop files here'}
                </p>
                <p className="text-sm text-slate-500">
                  or click to browse your files
                </p>
              </>
            )}
          </div>

          {/* File Info */}
          {multiple && (
            <p className="text-xs text-slate-600">
              Max {maxFiles} files
            </p>
          )}
        </div>
      </div>

      {/* Rejected Files */}
      {fileRejections.length > 0 && (
        <div className="mt-4 result-error">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <span>⚠️</span> Some files were rejected
          </h3>
          {fileRejections.map(({ file, errors }, idx) => (
            <p key={idx} className="text-xs text-red-300">
              {file.name}: {errors.map(e => e.message).join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
