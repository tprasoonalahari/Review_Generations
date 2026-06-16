import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  FileText, 
  Presentation, 
  Upload, 
  Layers, 
  Search, 
  LogOut, 
  Plus, 
  CheckCircle,
  FileCheck
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [assetCount, setAssetCount] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSlidesModal, setShowSlidesModal] = useState(false);

  // Asset Form States
  const [assetTitle, setAssetTitle] = useState('');
  const [assetAudience, setAssetAudience] = useState('Doctor');
  const [assetType, setAssetType] = useState('Video');
  const [assetPdfFile, setAssetPdfFile] = useState<File | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetError, setAssetError] = useState('');

  // Slides Form States
  const [slidesTitle, setSlidesTitle] = useState('');
  const [clientSlideFile, setClientSlideFile] = useState<File | null>(null);
  const [productionSlideFile, setProductionSlideFile] = useState<File | null>(null);
  const [recreatedSlideFile, setRecreatedSlideFile] = useState<File | null>(null);
  const [slidesUploading, setSlidesUploading] = useState(false);
  const [slidesError, setSlidesError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [assetsRes, slidesRes] = await Promise.all([
          api.get('/workspace/assets'),
          api.get('/slides')
        ]);
        setAssetCount(assetsRes.data.length);
        setSlideCount(slidesRes.data.length);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetPdfFile || !assetFile) {
      setAssetError('Please select both a publication PDF and an asset file.');
      return;
    }

    setAssetUploading(true);
    setAssetError('');

    const formData = new FormData();
    formData.append('title', assetTitle);
    formData.append('audience_level', assetAudience);
    formData.append('asset_type', assetType);
    formData.append('pdf_file', assetPdfFile);
    formData.append('asset_file', assetFile);

    try {
      await api.post('/workspace/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAssetModal(false);
      // Reset form
      setAssetTitle('');
      setAssetPdfFile(null);
      setAssetFile(null);
      navigate('/workspace');
    } catch (error: any) {
      console.error('Error uploading asset:', error);
      setAssetError(error.response?.data?.detail || 'Failed to upload asset. Please try again.');
    } finally {
      setAssetUploading(false);
    }
  };

  const handleSlidesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSlideFile || !productionSlideFile || !recreatedSlideFile) {
      setSlidesError('Please upload all three presentation slides.');
      return;
    }

    // Check extensions (must be pptx)
    for (const f of [clientSlideFile, productionSlideFile, recreatedSlideFile]) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pptx') {
        setSlidesError('All uploaded slides must be in .pptx format only.');
        return;
      }
    }

    setSlidesUploading(true);
    setSlidesError('');

    const formData = new FormData();
    formData.append('title', slidesTitle);
    formData.append('client_slide', clientSlideFile);
    formData.append('production_slide', productionSlideFile);
    formData.append('recreated_slide', recreatedSlideFile);

    try {
      await api.post('/slides', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowSlidesModal(false);
      // Reset form
      setSlidesTitle('');
      setClientSlideFile(null);
      setProductionSlideFile(null);
      setRecreatedSlideFile(null);
      navigate('/review-slides');
    } catch (error: any) {
      console.error('Error uploading slides:', error);
      setSlidesError(error.response?.data?.detail || 'Failed to upload slides. Please try again.');
    } finally {
      setSlidesUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Background gradients for WOW aesthetics */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#0f244b] to-transparent pointer-events-none opacity-80" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="text-white w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              Orakris <span className="text-blue-400 font-semibold">Review Suite</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Review & Verification Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">{user?.email}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/20">
              {user?.role}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-800"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Welcome Section */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-4 sm:text-5xl leading-tight">
            Welcome back to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Review Hub</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Verify multimodal generation output, review medical publication files, and compare presentation slides side-by-side. Select a workflow below to get started.
          </p>
        </div>

        {/* Dual Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Use Case 1: Multimodal Assets */}
          <div className="group bg-slate-800/40 backdrop-blur-xl border border-slate-800/80 hover:border-blue-500/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-blue-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Multimodal Assets Suite</h3>
                <p className="text-xs text-slate-400">Videos, PPTs, Posters & Infographics</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-8 flex-1">
              Upload original publication research PDFs along with their generated multimodal output channels (like audience-specific landing videos, posters, or infographics). Perform targeted verification audits and comment directly on sections.
            </p>

            <div className="flex gap-4">
              {(user?.role === 'admin' || user?.role === 'creator') && (
                <button
                  onClick={() => setShowAssetModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Upload size={16} /> Upload Asset
                </button>
              )}
              <button
                onClick={() => navigate('/workspace')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                <Search size={16} /> Review Asset
              </button>
            </div>
            
            {/* Stats Badge */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Active Database Records</span>
              <span className="font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10">
                {loadingStats ? '...' : `${assetCount} Assets`}
              </span>
            </div>
          </div>

          {/* Use Case 2: Presentation Slides */}
          <div className="group bg-slate-800/40 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Presentation size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Presentation Slide Hub</h3>
                <p className="text-xs text-slate-400">Side-by-Side Presentation Checks</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-8 flex-1">
              Upload Client Pitch slides, Production team decks, and Recreated master slide sets together in `.pptx` format. Review all three versions side-by-side concurrently to cross-compare and coordinate revision notes.
            </p>

            <div className="flex gap-4">
              {(user?.role === 'admin' || user?.role === 'creator') && (
                <button
                  onClick={() => setShowSlidesModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus size={16} /> Upload Slides
                </button>
              )}
              <button
                onClick={() => navigate('/review-slides')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200"
              >
                <Search size={16} /> Review Slides
              </button>
            </div>

            {/* Stats Badge */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><FileCheck size={14} className="text-indigo-400" /> Comparative Slide Submissions</span>
              <span className="font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                {loadingStats ? '...' : `${slideCount} Slide Sets`}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Asset Upload Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Upload Multimodal Asset</h3>
            <p className="text-slate-400 text-xs mb-6">Create a database record mapping the publication reference to its asset.</p>

            {assetError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-xs font-semibold">
                {assetError}
              </div>
            )}

            <form onSubmit={handleAssetSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Publication Title</label>
                <input 
                  type="text" required value={assetTitle} onChange={e => setAssetTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="e.g. Clinical Trial Evaluation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Audience Level</label>
                  <select 
                    value={assetAudience} onChange={e => setAssetAudience(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="Field force">Field force</option>
                    <option value="MSLs">MSLs</option>
                    <option value="Doctor">Doctor</option>
                    <option value="HCP">HCP</option>
                    <option value="Patient">Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Asset Type</label>
                  <select 
                    value={assetType} onChange={e => setAssetType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="Video">Video</option>
                    <option value="PPT">PPT</option>
                    <option value="Poster">Poster</option>
                    <option value="Infographic">Infographic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Source Publication (PDF)</label>
                <input 
                  type="file" accept=".pdf" required onChange={e => setAssetPdfFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Generated Asset File</label>
                <input 
                  type="file" required onChange={e => setAssetFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setShowAssetModal(false); setAssetError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assetUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-blue-500/10 transition-all text-sm"
                >
                  {assetUploading ? 'Uploading...' : 'Submit Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slides Upload Modal */}
      {showSlidesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Upload Slide Presentations</h3>
            <p className="text-slate-400 text-xs mb-6">Select three PowerPoint files representing the client, team, and recreated master slides.</p>

            {slidesError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-xs font-semibold">
                {slidesError}
              </div>
            )}

            <form onSubmit={handleSlidesSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project / Slide Name</label>
                <input 
                  type="text" required value={slidesTitle} onChange={e => setSlidesTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="e.g. Q4 Executive Sales Review"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">1. Client Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setClientSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">2. Production Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setProductionSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">3. Recreated Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setRecreatedSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setShowSlidesModal(false); setSlidesError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slidesUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-500/10 transition-all text-sm"
                >
                  {slidesUploading ? 'Uploading...' : 'Submit Slides'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
