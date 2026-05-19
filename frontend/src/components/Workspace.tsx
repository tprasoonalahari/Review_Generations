import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Search, LogOut, Trash2 } from 'lucide-react';

interface Asset {
  publication_id: string;
  publication_title: string;
  generation_id: string;
  audience_level: string;
  asset_type: string;
}

const Workspace: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Doctor');
  const [assetType, setAssetType] = useState('Video');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/workspace/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !assetFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('audience_level', audience);
    formData.append('asset_type', assetType);
    formData.append('pdf_file', pdfFile);
    formData.append('asset_file', assetFile);

    try {
      await api.post('/workspace/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowForm(false);
      fetchAssets();
      // Reset form
      setTitle('');
      setPdfFile(null);
      setAssetFile(null);
    } catch (error) {
      console.error('Error uploading asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (generationId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await api.delete(`/workspace/assets/${generationId}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-text p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text">Review & Hub Workspace</h1>
          <div className="flex gap-4">
            {(user?.role === 'admin' || user?.role === 'creator') && (
              <button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
              >
                <Plus size={20} /> Add New Asset
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-surface p-6 rounded-lg mb-8 border border-border shadow-md">
            <h2 className="text-xl font-semibold text-text mb-4">Upload New Publication & Asset</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Publication Title</label>
                <input 
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Publication PDF</label>
                <input 
                  type="file" accept=".pdf" required onChange={e => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-border rounded px-3 py-1.5 text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Audience Level</label>
                <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-white border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary">
                  <option value="Doctor">Doctor</option>
                  <option value="HCP">HCP</option>
                  <option value="Professional">Professional</option>
                  <option value="Patient">Patient</option>
                  <option value="Scientist">Scientist</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Asset Type</label>
                <select value={assetType} onChange={e => setAssetType(e.target.value)} className="w-full bg-white border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary">
                  <option value="Video">Video</option>
                  <option value="PPT">PPT</option>
                  <option value="Poster">Poster</option>
                  <option value="Infographic">Infographic</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-text-muted">Generation Asset File (MP4, MP3, PPTX, etc)</label>
                <input 
                  type="file" required onChange={e => setAssetFile(e.target.files?.[0] || null)}
                  className="w-full bg-white border border-border rounded px-3 py-1.5 text-text file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2 rounded font-medium transition-colors">
                  {loading ? 'Uploading...' : 'Submit Records'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-surface rounded-lg overflow-hidden border border-border shadow-md">
          <table className="w-full text-left">
            <thead className="bg-background border-b border-border text-text">
              <tr>
                <th className="px-6 py-4 font-semibold">Publication Name</th>
                <th className="px-6 py-4 font-semibold">Audience</th>
                <th className="px-6 py-4 font-semibold">Asset Type</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((asset) => (
                <tr key={asset.generation_id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 text-text">{asset.publication_title}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-background border border-border rounded text-sm text-text-muted">{asset.audience_level}</span></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">{asset.asset_type}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/review/${asset.generation_id}`)}
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition-colors"
                      >
                        <Search size={16} /> Review Asset
                      </button>
                      {(user?.role === 'admin' || user?.role === 'creator') && (
                        <button 
                          onClick={() => handleDelete(asset.generation_id)}
                          className="inline-flex items-center justify-center bg-white border border-border hover:bg-red-50 text-red-500 hover:text-red-600 px-3 py-2 rounded transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                    No assets found. Upload one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
