import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, Trash2, ArrowLeft, FileText } from 'lucide-react';

interface Asset {
  publication_id: string;
  publication_title: string;
  generation_id: string;
  audience_level: string;
  asset_type: string;
  uploaded_by: string;
  pdf_url?: string;
  generation_url?: string;
}

interface GroupedPublication {
  publication_id: string;
  publication_title: string;
  uploaded_by: string;
  assets: Asset[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getGroupedPublications = (flatAssets: Asset[]): GroupedPublication[] => {
  const groups: { [key: string]: GroupedPublication } = {};
  flatAssets.forEach((asset) => {
    if (!groups[asset.publication_id]) {
      groups[asset.publication_id] = {
        publication_id: asset.publication_id,
        publication_title: asset.publication_title,
        uploaded_by: asset.uploaded_by,
        assets: [],
      };
    }
    groups[asset.publication_id].assets.push(asset);
  });
  return Object.values(groups);
};

const Workspace: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

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
              className="p-2.5 bg-white border border-border hover:bg-slate-50 text-text-muted hover:text-text rounded-xl shadow-sm transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0B3C88] to-[#00B5FF] tracking-tight">Review Hub - Orakris</h1>
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
                getGroupedPublications(assets).map((pub) => (
                  <React.Fragment key={pub.publication_id}>
                    {pub.assets.map((asset, assetIdx) => (
                      <tr key={asset.generation_id} className="hover:bg-blue-50/50 transition-colors group">
                        {assetIdx === 0 && (
                          <>
                            <td 
                              className="px-6 py-5 text-text font-semibold align-middle border-r border-border bg-white" 
                              rowSpan={pub.assets.length}
                            >
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[#0B3C88] text-base leading-snug">{pub.publication_title}</span>
                                {asset.pdf_url && (
                                  <a 
                                    href={`${API_BASE_URL}${asset.pdf_url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-primary hover:text-primary-hover hover:underline flex items-center gap-1 font-semibold w-fit"
                                  >
                                    <FileText size={13} /> View Source PDF
                                  </a>
                                )}
                              </div>
                            </td>
                            <td 
                              className="px-6 py-5 whitespace-nowrap align-middle border-r border-border bg-white" 
                              rowSpan={pub.assets.length}
                            >
                              <span className="text-sm font-semibold text-text flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                  {pub.uploaded_by ? pub.uploaded_by.charAt(0).toUpperCase() : '?'}
                                </div>
                                {pub.uploaded_by}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-5 whitespace-nowrap align-middle">
                          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide">
                            {asset.audience_level}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap align-middle">
                          <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold tracking-wide">
                            {asset.asset_type}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap align-middle">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => navigate(`/review/${asset.generation_id}`)}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200 font-semibold cursor-pointer"
                            >
                              <Search size={16} /> Review Asset
                            </button>
                            <button 
                              onClick={() => handleDelete(asset.generation_id)}
                              className="inline-flex items-center justify-center bg-white border border-border hover:bg-red-50 text-red-500 hover:text-red-600 px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                              title="Delete Asset"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
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
