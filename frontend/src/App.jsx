import { useState } from 'react';
import FileUploader from './components/FileUploader';
import { 
  mergePDFs, 
  splitPDF, 
  getPDFInfo,
  compressImage, 
  resizeImage,
  convertImage,
  downloadFile 
} from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('merge-pdf');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // PDF Split specific state
  const [pageRanges, setPageRanges] = useState('');
  
  // Image specific state
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [imageFormat, setImageFormat] = useState('jpeg');

  const resetState = () => {
    setSelectedFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetState();
  };

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
    setResult(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files first');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      let response;
      let filename = 'processed-file';

      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      };

      switch (activeTab) {
        case 'merge-pdf':
          if (selectedFiles.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge');
          }
          response = await mergePDFs(selectedFiles, onUploadProgress);
          filename = 'merged.pdf';
          break;

        case 'split-pdf':
          if (!pageRanges) {
            throw new Error('Please enter page ranges (e.g., "1-3,5,7-9")');
          }
          response = await splitPDF(selectedFiles[0], pageRanges, onUploadProgress);
          filename = `split-pages-${pageRanges.replace(/,/g, '_')}.pdf`;
          break;

        case 'pdf-info':
          const info = await getPDFInfo(selectedFiles[0]);
          setResult({ type: 'info', data: info });
          setLoading(false);
          return;

        case 'compress-image':
          response = await compressImage(selectedFiles[0], quality, onUploadProgress);
          filename = `compressed-${selectedFiles[0].name}`;
          break;

        case 'resize-image':
          if (!width && !height) {
            throw new Error('Please enter width and/or height');
          }
          response = await resizeImage(
            selectedFiles[0], 
            width ? parseInt(width) : null, 
            height ? parseInt(height) : null, 
            quality,
            onUploadProgress
          );
          filename = `resized-${selectedFiles[0].name}`;
          break;

        case 'convert-image':
          response = await convertImage(selectedFiles[0], imageFormat, quality, onUploadProgress);
          const nameWithoutExt = selectedFiles[0].name.split('.').slice(0, -1).join('.');
          filename = `${nameWithoutExt}.${imageFormat}`;
          break;

        default:
          throw new Error('Unknown operation');
      }

      if (response) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        downloadFile(blob, filename);
        
        setResult({
          type: 'download',
          message: `✅ Success! File downloaded: ${filename}`,
          headers: response.headers
        });
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.error || err.message || 'Processing failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const tabs = [
    { id: 'merge-pdf', label: '🔗 Merge PDF', category: 'pdf' },
    { id: 'split-pdf', label: '✂️ Split PDF', category: 'pdf' },
    { id: 'pdf-info', label: 'ℹ️ PDF Info', category: 'pdf' },
    { id: 'compress-image', label: '🗜️ Compress Image', category: 'image' },
    { id: 'resize-image', label: '📏 Resize Image', category: 'image' },
    { id: 'convert-image', label: '🔄 Convert Image', category: 'image' },
  ];

  const pdfTabs = tabs.filter(t => t.category === 'pdf');
  const imageTabs = tabs.filter(t => t.category === 'image');

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="text-gradient">ProPDF</span>
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            Professional PDF & Image Processing
          </p>
          <p className="text-sm text-slate-500">
            Powered by Microservices Architecture
          </p>
        </header>

        {/* Main Card */}
        <div className="card animate-slide-up">
          {/* Category Tabs */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">📄 PDF Tools</h3>
              <div className="space-y-2">
                {pdfTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full tab ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">🖼️ Image Tools</h3>
              <div className="space-y-2">
                {imageTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full tab ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* File Uploader */}
          <div className="mb-6">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept={
                activeTab.includes('pdf') 
                  ? { 'application/pdf': ['.pdf'] }
                  : { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
              }
              multiple={activeTab === 'merge-pdf'}
              maxFiles={activeTab === 'merge-pdf' ? 20 : 1}
              label={
                activeTab === 'merge-pdf' 
                  ? 'Select multiple PDFs to merge'
                  : activeTab.includes('pdf')
                  ? 'Select a PDF file'
                  : 'Select an image file'
              }
            />
          </div>

          {/* Operation-specific Options */}
          {activeTab === 'split-pdf' && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Page Ranges
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., 1-3,5,7-9"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">
                Use commas to separate individual pages or ranges. Example: "1-3,5,7-9"
              </p>
            </div>
          )}

          {(activeTab === 'compress-image' || activeTab === 'resize-image' || activeTab === 'convert-image') && (
            <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full accent-primary-500"
                />
              </div>

              {activeTab === 'resize-image' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Auto"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Auto"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'convert-image' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Output Format
                  </label>
                  <select
                    className="input-field"
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value)}
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="avif">AVIF</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={loading || selectedFiles.length === 0}
            className={`w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'animate-pulse' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing... {progress}%
              </span>
            ) : (
              'Process Files'
            )}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg animate-fade-in">
              {result.type === 'download' && (
                <div>
                  <p className="text-green-400 font-semibold">{result.message}</p>
                  {result.headers && (
                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                      {result.headers['x-total-pages'] && <p>Total Pages: {result.headers['x-total-pages']}</p>}
                      {result.headers['x-compression-ratio'] && <p>Compression: {result.headers['x-compression-ratio']}% reduction</p>}
                    </div>
                  )}
                </div>
              )}

              {result.type === 'info' && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white mb-3">📋 PDF Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400">Filename</p>
                      <p className="text-white font-semibold">{result.data.filename}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400">File Size</p>
                      <p className="text-white font-semibold">{result.data.fileSizeKB} KB</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400">Pages</p>
                      <p className="text-white font-semibold">{result.data.pageCount}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400">Page Size</p>
                      <p className="text-white font-semibold">{result.data.pageSize.width}×{result.data.pageSize.height} pts</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg col-span-2">
                      <p className="text-slate-400">Title</p>
                      <p className="text-white font-semibold">{result.data.title}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg animate-fade-in">
              <p className="text-red-400 font-semibold">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Built with React, Node.js, Docker & Microservices</p>
          <p className="mt-2">Image Service • PDF Service • API Gateway</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
