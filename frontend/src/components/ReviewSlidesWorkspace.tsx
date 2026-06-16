import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';

interface SlideSubmission {
  id: string;
  title: string;
  client_slide_url: string;
  production_slide_url: string;
  recreated_slide_url: string;
  uploaded_by: string;
  created_at: string;
}

const ReviewSlidesWorkspace: React.FC = () => {
  const [submissions, setSubmissions] = useState<SlideSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/slides');
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching slide submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this slide submission set?')) {
      try {
        await api.delete(`/slides/${id}`);
        fetchSubmissions();
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Failed to delete slide set. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      {/* Background aesthetics */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#0f244b]/60 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Presentation Slide Review Hub
              </h1>
              <p className="text-xs text-slate-400">Manage, launch, and review side-by-side presentation decks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
              Presentation Slide Flow
            </span>
          </div>
        </div>

        {/* Submissions Table/List */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/60 text-slate-300">
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[11px] text-slate-400">Presentation / Slide Title</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[11px] text-slate-400 whitespace-nowrap">Uploaded By</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[11px] text-slate-400 whitespace-nowrap">Date Uploaded</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-[11px] text-slate-400 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-sm">Loading slide sets...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">
                    No presentation slide sets found. Go back to the dashboard to upload one.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-8 py-5 text-white font-semibold text-sm">
                      {sub.title}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold">
                          U
                        </div>
                        Slide Reviewer
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(sub.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => navigate(`/review-slides/${sub.id}`)}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-2 rounded-xl shadow-lg shadow-indigo-500/10 hover:-translate-y-0.5 transform transition-all duration-200 text-xs font-bold"
                        >
                          <Search size={14} /> Review Side-by-Side
                        </button>
                        {(user?.role === 'admin' || user?.role === 'creator') && (
                          <button 
                            onClick={() => handleDelete(sub.id)}
                            className="inline-flex items-center justify-center bg-slate-850 hover:bg-red-900/20 border border-slate-700/60 text-slate-400 hover:text-red-400 px-3 py-2 rounded-xl transition-all duration-200"
                            title="Delete Slide Set"
                          >
                            <Trash2 size={14} />
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

export default ReviewSlidesWorkspace;
