import { useState } from 'react';
import { WavyBackground } from './components/ui/wavy-background';
import { FileUpload } from './components/ui/file-upload';
import { Sidebar, SidebarBody, SidebarLink, SidebarLinkActive } from './components/ui/sidebar';
import { motion } from 'framer-motion';
import { 
  IconFileTypePdf,
  IconCut,
  IconInfoCircle,
  IconPhotoDown,
  IconResize,
  IconTransform,
  IconPhoto,
  IconFileZip,
} from '@tabler/icons-react';
import { 
  mergePDFs, 
  splitPDF, 
  getPDFInfo,
  imagesToPdf,
  compressPdf,
  compressImage, 
  resizeImage,
  convertImage,
  downloadFile 
} from './services/api';
import { cn } from './lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState('merge-pdf');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        case 'images-to-pdf':
          if (selectedFiles.length === 0) {
            throw new Error('Please select at least 1 image to convert');
          }
          response = await imagesToPdf(selectedFiles, onUploadProgress);
          filename = 'images-to-pdf.pdf';
          break;

        case 'compress-pdf':
          response = await compressPdf(selectedFiles[0], onUploadProgress);
          filename = `compressed-${selectedFiles[0].name}`;
          break;

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
          message: `Success! File downloaded: ${filename}`,
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

  const pdfLinks = [
    { 
      id: 'merge-pdf',
      label: 'Merge PDF', 
      icon: <IconFileTypePdf className="h-5 w-5 shrink-0 text-indigo-400" />,
      description: 'Combine multiple PDFs'
    },
    { 
      id: 'split-pdf',
      label: 'Split PDF', 
      icon: <IconCut className="h-5 w-5 shrink-0 text-indigo-400" />,
      description: 'Extract specific pages'
    },
    { 
      id: 'pdf-info',
      label: 'PDF Info', 
      icon: <IconInfoCircle className="h-5 w-5 shrink-0 text-indigo-400" />,
      description: 'View document details'
    },
    { 
      id: 'images-to-pdf',
      label: 'Images to PDF', 
      icon: <IconPhoto className="h-5 w-5 shrink-0 text-indigo-400" />,
      description: 'Convert images to PDF'
    },
    { 
      id: 'compress-pdf',
      label: 'Compress PDF', 
      icon: <IconFileZip className="h-5 w-5 shrink-0 text-indigo-400" />,
      description: 'Reduce PDF file size'
    },
  ];

  const imageLinks = [
    { 
      id: 'compress-image',
      label: 'Compress', 
      icon: <IconPhotoDown className="h-5 w-5 shrink-0 text-pink-400" />,
      description: 'Reduce file size'
    },
    { 
      id: 'resize-image',
      label: 'Resize', 
      icon: <IconResize className="h-5 w-5 shrink-0 text-pink-400" />,
      description: 'Change dimensions'
    },
    { 
      id: 'convert-image',
      label: 'Convert', 
      icon: <IconTransform className="h-5 w-5 shrink-0 text-pink-400" />,
      description: 'Change format'
    },
  ];

  const currentTool = [...pdfLinks, ...imageLinks].find(t => t.id === activeTab);

  const Logo = () => (
    <a href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white">
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-indigo-500 to-purple-600" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-xl whitespace-pre text-white"
      >
        ProPDF
      </motion.span>
    </a>
  );

  const LogoIcon = () => (
    <a href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white">
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-indigo-500 to-purple-600" />
    </a>
  );

  return (
    <div className={cn(
      "flex w-full flex-1 flex-col overflow-hidden md:flex-row",
      "h-screen"
    )}>
      {/* Wavy Background */}
      <WavyBackground
        className="fixed inset-0 -z-10"
        containerClassName="fixed inset-0 -z-10"
        colors={["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#22d3ee"]}
        waveWidth={50}
        backgroundFill="#0a0a1a"
        blur={10}
        speed="slow"
        waveOpacity={0.5}
      />

      {/* Aceternity Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {sidebarOpen ? <Logo /> : <LogoIcon />}
            
            {/* PDF Tools */}
            <div className="mt-8">
              {sidebarOpen && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
                  PDF Tools
                </p>
              )}
              <div className="flex flex-col gap-2">
                {pdfLinks.map((link) => (
                  activeTab === link.id ? (
                    <SidebarLinkActive 
                      key={link.id} 
                      link={link} 
                      onClick={() => handleTabChange(link.id)}
                    />
                  ) : (
                    <SidebarLink 
                      key={link.id} 
                      link={link} 
                      onClick={() => handleTabChange(link.id)}
                    />
                  )
                ))}
              </div>
            </div>

            {/* Image Tools */}
            <div className="mt-6">
              {sidebarOpen && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
                  Image Tools
                </p>
              )}
              <div className="flex flex-col gap-2">
                {imageLinks.map((link) => (
                  activeTab === link.id ? (
                    <SidebarLinkActive 
                      key={link.id} 
                      link={link} 
                      onClick={() => handleTabChange(link.id)}
                    />
                  ) : (
                    <SidebarLink 
                      key={link.id} 
                      link={link} 
                      onClick={() => handleTabChange(link.id)}
                    />
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 pt-4">
            {sidebarOpen && (
              <p className="text-xs text-slate-500 text-center">
                Powered by Microservices
              </p>
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex flex-1 overflow-auto">
        <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl border-l border-white/10 bg-slate-900/40 backdrop-blur-sm p-6 md:p-10">
          {/* Header */}
          <header className="mb-4">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-gradient">{currentTool?.label}</span>
            </h1>
            <p className="text-slate-400">{currentTool?.description}</p>
          </header>

          {/* Main Card */}
          <div className="glass-card mb-6">
            {/* Full-Width File Upload */}
            <div className="w-full min-h-80 border border-dashed border-indigo-500/30 bg-slate-900/30 rounded-xl overflow-hidden mb-6">
              <FileUpload onChange={handleFilesSelected} />
            </div>

            {/* Operation-specific Options */}
            {activeTab === 'split-pdf' && (
              <div className="options-panel mb-6">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  📑 Page Ranges
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., 1-3,5,7-9"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use commas to separate individual pages or ranges
                </p>
              </div>
            )}

            {(activeTab === 'compress-image' || activeTab === 'resize-image' || activeTab === 'convert-image') && (
              <div className="options-panel mb-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    🎚️ Quality: <span className="text-indigo-400">{quality}%</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                  />
                </div>

                {activeTab === 'resize-image' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        ↔️ Width (px)
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
                        ↕️ Height (px)
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
                      📁 Output Format
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
              className={`w-full btn btn-primary text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing... {progress}%
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ⚡ Process Files
                </span>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="result-success animate-[fadeIn_0.3s_ease-out]">
              {result.type === 'download' && (
                <div>
                  <p className="text-green-400 font-semibold flex items-center gap-2">
                    <span className="text-xl">✅</span> {result.message}
                  </p>
                  {result.headers && (
                    <div className="mt-3 flex gap-4 text-sm">
                      {result.headers['x-total-pages'] && (
                        <span className="text-slate-400">
                          📄 {result.headers['x-total-pages']} pages
                        </span>
                      )}
                      {result.headers['x-compression-ratio'] && (
                        <span className="text-slate-400">
                          📉 {result.headers['x-compression-ratio']}% smaller
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {result.type === 'info' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span> PDF Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="info-card">
                      <p className="text-slate-400 text-xs mb-1">Filename</p>
                      <p className="text-white font-semibold text-sm truncate">{result.data.filename}</p>
                    </div>
                    <div className="info-card">
                      <p className="text-slate-400 text-xs mb-1">File Size</p>
                      <p className="text-white font-semibold text-sm">{result.data.fileSizeKB} KB</p>
                    </div>
                    <div className="info-card">
                      <p className="text-slate-400 text-xs mb-1">Pages</p>
                      <p className="text-white font-semibold text-sm">{result.data.pageCount}</p>
                    </div>
                    <div className="info-card">
                      <p className="text-slate-400 text-xs mb-1">Page Size</p>
                      <p className="text-white font-semibold text-sm">{result.data.pageSize.width}×{result.data.pageSize.height}</p>
                    </div>
                    <div className="info-card col-span-2">
                      <p className="text-slate-400 text-xs mb-1">Title</p>
                      <p className="text-white font-semibold text-sm">{result.data.title || 'Untitled'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {error && (
            <div className="result-error animate-[fadeIn_0.3s_ease-out]">
              <p className="text-red-400 font-semibold flex items-center gap-2">
                <span className="text-xl">❌</span> {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
