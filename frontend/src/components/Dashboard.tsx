import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FileCheck,
  X,
  Video,
  FileSpreadsheet,
  Image,
  Volume2,
  PieChart
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Stats
  const [assetCount, setAssetCount] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSlidesModal, setShowSlidesModal] = useState(false);

  // Asset Form States
  const [assetTitle, setAssetTitle] = useState('');
  const [assetAudience, setAssetAudience] = useState('Doctor');
  const [assetPdfFile, setAssetPdfFile] = useState<File | null>(null);
  
  // Individual optional asset files
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [infographicFile, setInfographicFile] = useState<File | null>(null);

  const [assetUploading, setAssetUploading] = useState(false);
  const [assetError, setAssetError] = useState('');

  // Slides Form States
  const [slidesTitle, setSlidesTitle] = useState('');
  const [clientSlideFile, setClientSlideFile] = useState<File | null>(null);
  const [productionSlideFile, setProductionSlideFile] = useState<File | null>(null);
  const [recreatedSlideFile, setRecreatedSlideFile] = useState<File | null>(null);
  const [slidesUploading, setSlidesUploading] = useState(false);
  const [slidesError, setSlidesError] = useState('');

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

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).openUploadAsset) {
      setShowAssetModal(true);
      // Clear location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetPdfFile) {
      setAssetError('Please select a source publication PDF.');
      return;
    }

    if (!videoFile && !pptFile && !posterFile && !audioFile && !infographicFile) {
      setAssetError('Please upload at least one generated asset (Video, PPT, Poster, Audio Summary, or Infographic).');
      return;
    }

    setAssetUploading(true);
    setAssetError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('title', assetTitle);
    formData.append('audience_level', assetAudience);
    formData.append('pdf_file', assetPdfFile);
    
    if (videoFile) formData.append('video_file', videoFile);
    if (pptFile) formData.append('ppt_file', pptFile);
    if (posterFile) formData.append('poster_file', posterFile);
    if (audioFile) formData.append('audio_file', audioFile);
    if (infographicFile) formData.append('infographic_file', infographicFile);

    try {
      await api.post('/workspace/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAssetModal(false);
      setSuccessMessage(`Success! Multimodal assets for "${assetTitle}" uploaded successfully.`);
      // Reset form
      setAssetTitle('');
      setAssetPdfFile(null);
      setVideoFile(null);
      setPptFile(null);
      setPosterFile(null);
      setAudioFile(null);
      setInfographicFile(null);
      // Refresh stats
      fetchStats();
    } catch (error: any) {
      console.error('Error uploading asset:', error);
      setAssetError(error.response?.data?.detail || 'Failed to upload assets. Please try again.');
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
    setSuccessMessage('');

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
      setSuccessMessage(`Success! Slide presentation "${slidesTitle}" uploaded successfully.`);
      // Reset form
      setSlidesTitle('');
      setClientSlideFile(null);
      setProductionSlideFile(null);
      setRecreatedSlideFile(null);
      // Refresh stats
      fetchStats();
    } catch (error: any) {
      console.error('Error uploading slides:', error);
      setSlidesError(error.response?.data?.detail || 'Failed to upload slides. Please try again.');
    } finally {
      setSlidesUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans relative animate-fade-in">
      {/* Dynamic background decoration in brand color */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center border-b border-border bg-white/50 backdrop-blur-md rounded-b-2xl shadow-sm shadow-blue-900/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B3C88] to-primary flex items-center justify-center shadow-md shadow-blue-950/10">
            <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0B3C88]">
              Orakris <span className="text-primary font-bold">Review Suite</span>
            </h1>
            <p className="text-[10px] text-text-muted font-mono tracking-widest uppercase">Collaborative Workspace</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white border border-border rounded-full text-xs shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-text">{user?.email}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#0B3C88]/10 text-[#0B3C88] rounded-full border border-[#0B3C88]/10">
              Active
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-[#0B3C88] transition-colors py-1.5 px-3 rounded-xl hover:bg-white border border-transparent hover:border-border shadow-xs hover:shadow-sm cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        
        {/* Success Alert Banner */}
        {successMessage && (
          <div className="max-w-3xl mx-auto w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-5 py-4 rounded-2xl mb-8 flex justify-between items-center shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="text-emerald-700 hover:text-emerald-900 transition-colors p-1 rounded-lg hover:bg-emerald-500/10 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0B3C88] mb-4 sm:text-5xl leading-tight">
            Welcome back to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0B3C88] to-primary">Review Hub</span>
          </h2>
          <p className="text-text-muted text-lg leading-relaxed">
            Verify multimodal generation output, review medical publication files, and compare presentation slides side-by-side. Select a workflow below to get started.
          </p>
        </div>

        {/* Dual Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Use Case 1: Multimodal Assets */}
          <div className="group bg-surface border border-border hover:border-primary/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-primary/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B3C88]">Multimodal Assets Suite</h3>
                <p className="text-xs text-text-muted">Videos, PPTs, Posters & Infographics</p>
              </div>
            </div>

            <p className="text-text-muted text-sm leading-relaxed mb-8 flex-1">
              Upload original publication research PDFs along with their generated multimodal output channels (like audience-specific landing videos, posters, or infographics). Perform targeted verification audits and comment directly on sections.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowAssetModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3C88] to-primary hover:from-[#072758] hover:to-primary text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-950/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Upload size={16} /> Upload Asset
              </button>
              <button
                onClick={() => navigate('/workspace')}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#0B3C88] font-bold py-3.5 px-4 rounded-xl border border-border hover:border-slate-300 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Search size={16} /> Review Asset
              </button>
            </div>
            
            {/* Stats Badge */}
            <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Active Database Records</span>
              <span className="font-mono bg-blue-50 text-[#0B3C88] px-3 py-1 rounded-full border border-blue-100 font-bold">
                {loadingStats ? '...' : `${assetCount} Assets`}
              </span>
            </div>
          </div>

          {/* Use Case 2: Presentation Slides */}
          <div className="group bg-surface border border-border hover:border-primary/40 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-primary/5 rounded-bl-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 group-hover:scale-105 transition-transform">
                <Presentation size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B3C88]">Presentation Slide Hub</h3>
                <p className="text-xs text-text-muted">Side-by-Side Presentation Checks</p>
              </div>
            </div>

            <p className="text-text-muted text-sm leading-relaxed mb-8 flex-1">
              Upload Client Pitch slides, Production team decks, and Recreated master slide sets together in `.pptx` format. Review all three versions side-by-side concurrently to cross-compare and coordinate revision notes.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSlidesModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Plus size={16} /> Upload Slides
              </button>
              <button
                onClick={() => navigate('/review-slides')}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#0B3C88] font-bold py-3.5 px-4 rounded-xl border border-border hover:border-slate-300 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Search size={16} /> Review Slides
              </button>
            </div>

            {/* Stats Badge */}
            <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><FileCheck size={14} className="text-primary" /> Comparative Slide Submissions</span>
              <span className="font-mono bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full border border-cyan-100 font-bold">
                {loadingStats ? '...' : `${slideCount} Slide Sets`}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Asset Upload Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold text-[#0B3C88]">Upload Multimodal Assets</h3>
              <button 
                onClick={() => { setShowAssetModal(false); setAssetError(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-text-muted text-xs mb-6">Create a database record mapping the publication reference to its generated multimodal asset files.</p>

            {assetError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-4 text-xs font-semibold">
                {assetError}
              </div>
            )}

            <form onSubmit={handleAssetSubmit} className="space-y-6">
              {/* Publication Info Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3C88] mb-1">1. Publication Reference</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Publication Title</label>
                    <input 
                      type="text" required value={assetTitle} onChange={e => setAssetTitle(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text placeholder-slate-400 focus:outline-none focus:border-primary text-sm shadow-xs"
                      placeholder="e.g. Zinc Obesity Clinical Trial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Target Audience</label>
                    <select 
                      value={assetAudience} onChange={e => setAssetAudience(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary text-sm shadow-xs"
                    >
                      <option value="Field force">Field force</option>
                      <option value="MSLs">MSLs</option>
                      <option value="Doctor">Doctor</option>
                      <option value="HCP">HCP</option>
                      <option value="Patient">Patient</option>
                      <option value="Professional">Professional</option>
                      <option value="Scientist">Scientist</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Source Publication (PDF)</label>
                  <input 
                    type="file" accept=".pdf" required onChange={e => setAssetPdfFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-border rounded-xl px-4 py-2 text-text text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer shadow-xs"
                  />
                </div>
              </div>

              {/* Generated Assets Selection */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-border space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3C88] mb-1">2. Generated Assets (Select one or more)</h4>
                
                {/* Video */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5 w-[35%] shrink-0">
                    <Video size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-text">Video Summary</span>
                  </div>
                  <input 
                    type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-text text-xs file:mr-3 file:py-0.5 file:px-2.5 file:rounded file:border-0 file:bg-slate-100 file:text-text hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                {/* PPT */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5 w-[35%] shrink-0">
                    <FileSpreadsheet size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-text">PowerPoint Slide (PPTX)</span>
                  </div>
                  <input 
                    type="file" accept=".pptx,.ppt" onChange={e => setPptFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-text text-xs file:mr-3 file:py-0.5 file:px-2.5 file:rounded file:border-0 file:bg-slate-100 file:text-text hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                {/* Poster */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5 w-[35%] shrink-0">
                    <Image size={16} className="text-purple-500" />
                    <span className="text-xs font-bold text-text">Medical Poster</span>
                  </div>
                  <input 
                    type="file" accept="image/*,.pdf" onChange={e => setPosterFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-text text-xs file:mr-3 file:py-0.5 file:px-2.5 file:rounded file:border-0 file:bg-slate-100 file:text-text hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                {/* Audio summary */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5 w-[35%] shrink-0">
                    <Volume2 size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-text">Audio Summary</span>
                  </div>
                  <input 
                    type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-text text-xs file:mr-3 file:py-0.5 file:px-2.5 file:rounded file:border-0 file:bg-slate-100 file:text-text hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                {/* Infographic */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 w-[35%] shrink-0">
                    <PieChart size={16} className="text-cyan-500" />
                    <span className="text-xs font-bold text-text">Infographic Summary</span>
                  </div>
                  <input 
                    type="file" accept="image/*,.pdf" onChange={e => setInfographicFile(e.target.files?.[0] || null)}
                    className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-text text-xs file:mr-3 file:py-0.5 file:px-2.5 file:rounded file:border-0 file:bg-slate-100 file:text-text hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowAssetModal(false); setAssetError(''); }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-muted font-bold transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assetUploading}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-[#0B3C88] hover:bg-[#072758] text-white font-bold shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
                >
                  {assetUploading ? 'Uploading Assets...' : 'Submit Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slides Upload Modal */}
      {showSlidesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-[#0B3C88] mb-2">Upload Slide Presentations</h3>
            <p className="text-text-muted text-xs mb-6">Select three PowerPoint files representing the client, team, and recreated master slides.</p>

            {slidesError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-4 text-xs font-semibold">
                {slidesError}
              </div>
            )}

            <form onSubmit={handleSlidesSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Project / Slide Name</label>
                <input 
                  type="text" required value={slidesTitle} onChange={e => setSlidesTitle(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-text placeholder-slate-400 focus:outline-none focus:border-primary text-sm shadow-xs"
                  placeholder="e.g. Q4 Executive Sales Review"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">1. Client Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setClientSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">2. Production Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setProductionSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">3. Recreated Slide (.pptx only)</label>
                <input 
                  type="file" accept=".pptx" required onChange={e => setRecreatedSlideFile(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-text text-xs file:mr-4 file:py-1 file:px-3.5 file:rounded-lg file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer shadow-xs"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowSlidesModal(false); setSlidesError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-muted font-bold transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slidesUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
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
