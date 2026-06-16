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
    <div className="min-h-screen bg-background text-text p-8">
      <div className="max-w-7xl mx-auto">
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
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0B3C88] to-[#00B5FF] tracking-tight">Review Hub - Orakris</h1>
          </div>
        </div>

        {/* Submissions Table/List */}
        <div className="bg-surface rounded-2xl overflow-hidden border border-white shadow-xl shadow-blue-900/5">
          <table className="w-full text-left">
            <thead className="bg-[#0B3C88] text-white shadow-sm">
              <tr>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs w-full">Presentation Name</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Uploaded By</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Date Uploaded</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-sm">Loading slide sets...</span>
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                    No presentation slide sets found. Go back to the dashboard to upload one.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-5 text-text font-medium">
                      {sub.title}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-text flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">
                          {sub.uploaded_by ? sub.uploaded_by.charAt(0).toUpperCase() : '?'}
                        </div>
                        {sub.uploaded_by}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold tracking-wide">
                        {new Date(sub.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => navigate(`/review-slides/${sub.id}`)}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-200 font-semibold cursor-pointer"
                        >
                          <Search size={16} /> Review Slides
                        </button>
                        {(user?.role === 'admin' || user?.role === 'creator') && (
                          <button 
                            onClick={() => handleDelete(sub.id)}
                            className="inline-flex items-center justify-center bg-white border border-border hover:bg-red-50 text-red-500 hover:text-red-600 px-3 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                            title="Delete Slide Set"
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

export default ReviewSlidesWorkspace;
