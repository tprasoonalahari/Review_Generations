import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Search, LogOut, Trash2, ArrowLeft } from 'lucide-react';

interface Asset {
  publication_id: string;
  publication_title: string;
  generation_id: string;
  audience_level: string;
  asset_type: string;
  uploaded_by: string;
}

const Workspace: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const response = await api.get('/workspace/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2.5 bg-white border border-border hover:bg-slate-50 text-text-muted hover:text-text rounded-xl shadow-sm transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0B3C88] to-[#00B5FF] tracking-tight">Review Hub - Orakris</h1>
          </div>
          <div className="flex gap-4">
            {(user?.role === 'admin' || user?.role === 'creator') && (
              <button 
                onClick={() => navigate('/dashboard', { state: { openUploadAsset: true } })}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold cursor-pointer"
              >
                <Plus size={20} /> Add New Asset
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors cursor-pointer">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-2xl overflow-hidden border border-white shadow-xl shadow-blue-900/5">
          <table className="w-full text-left">
             <thead className="bg-[#0B3C88] text-white shadow-sm">
              <tr>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs w-full">Publication Name</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Uploaded By</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Audience</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Asset Type</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assetsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-sm">Loading assets...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No assets found. Upload one to get started.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.generation_id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-5 text-text font-medium">{asset.publication_title}</td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-text flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">{asset.uploaded_by ? asset.uploaded_by.charAt(0).toUpperCase() : '?'}</div>
                        {asset.uploaded_by}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap"><span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide">{asset.audience_level}</span></td>
                    <td className="px-6 py-5 whitespace-nowrap"><span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold tracking-wide">{asset.asset_type}</span></td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => navigate(`/review/${asset.generation_id}`)}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
                        >
                          <Search size={16} /> Review Asset
                        </button>
                        {(user?.role === 'admin' || user?.role === 'creator') && (
                          <button 
                            onClick={() => handleDelete(asset.generation_id)}
                            className="inline-flex items-center justify-center bg-white border border-border hover:bg-red-50 text-red-500 hover:text-red-600 px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                            title="Delete Asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
