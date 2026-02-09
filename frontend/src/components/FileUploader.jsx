import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUploader = ({ onFilesSelected, accept, multiple = true, maxFiles = 20, label }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10 scale-105' 
            : 'border-slate-600 bg-slate-800/30 hover:border-primary-600 hover:bg-slate-800/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg 
              className={`w-16 h-16 ${isDragActive ? 'text-primary-400 animate-bounce' : 'text-slate-500'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            {isDragActive ? (
              <p className="text-xl font-semibold text-primary-400 animate-pulse">
                Drop the files here...
              </p>
            ) : (
              <>
                <p className="text-lg font-semibold text-white mb-2">
                  {label || 'Drag & drop files here'}
                </p>
                <p className="text-sm text-slate-400">
                  or click to browse
                </p>
              </>
            )}
          </div>

          {/* File Info */}
          {multiple && (
            <p className="text-xs text-slate-500">
              Maximum {maxFiles} files
            </p>
          )}
        </div>
      </div>

      {/* Selected Files */}
      {acceptedFiles.length > 0 && (
        <div className="mt-6 space-y-2 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Selected Files ({acceptedFiles.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {acceptedFiles.map((file, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-slate-800 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <svg className="w-5 h-5 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full flex-shrink-0">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Files */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg animate-fade-in">
          <h3 className="text-sm font-semibold text-red-400 mb-2">
            ⚠️ Some files were rejected
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
