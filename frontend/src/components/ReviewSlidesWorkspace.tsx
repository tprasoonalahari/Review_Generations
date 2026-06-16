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
    <div className="min-h-screen bg-background text-text p-8 font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2.5 bg-white border border-border hover:bg-slate-50 text-text-muted hover:text-text rounded-xl shadow-sm transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#0B3C88] to-primary">
                Presentation Slide Review Hub
              </h1>
              <p className="text-xs text-text-muted">Manage, launch, and review side-by-side presentation decks</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider bg-[#0B3C88]/10 text-[#0B3C88] px-3.5 py-1.5 rounded-full border border-[#0B3C88]/10 font-bold">
              Presentation Slide Flow
            </span>
          </div>
        </div>

        {/* Submissions Table/List */}
        <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-xl shadow-blue-900/5">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0B3C88] text-white">
              <tr>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs w-full">Presentation / Slide Title</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Uploaded By</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Date Uploaded</th>
                <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-sm">Loading slide sets...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic">
                    No presentation slide sets found. Go back to the dashboard to upload one.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-8 py-5 text-text font-bold text-sm">
                      {sub.title}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-text flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-[10px] font-bold">
                          U
                        </div>
                        Slide Reviewer
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-text-muted text-xs">
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
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200 text-xs font-bold cursor-pointer"
                        >
                          <Search size={14} /> Review Side-by-Side
                        </button>
                        {(user?.role === 'admin' || user?.role === 'creator') && (
                          <button 
                            onClick={() => handleDelete(sub.id)}
                            className="inline-flex items-center justify-center bg-white border border-border hover:bg-red-50 text-red-500 hover:text-red-600 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
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
