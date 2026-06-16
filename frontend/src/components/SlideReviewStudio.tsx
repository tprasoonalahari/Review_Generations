import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Send, Trash2, Edit2, Download, Monitor, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: string;
  text: string;
  user: string;
  created_at: string;
}

interface SlideSubmissionData {
  id: string;
  title: string;
  client_slide_url: string;
  production_slide_url: string;
  recreated_slide_url: string;
  uploaded_by_email: string;
  created_at: string;
  comments: Comment[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SlideReviewStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<SlideSubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Comments
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Clipboard copies
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const response = await api.get(`/slides/${id}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching slide detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.comments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/slides/${id}/comments`, { comment_text: newComment });
      setNewComment('');
      fetchData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const startEditing = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingText(text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    try {
      await api.put(`/slides/comments/${commentId}`, { comment_text: editingText });
      setEditingCommentId(null);
      setEditingText('');
      fetchData();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/slides/comments/${commentId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loading) {
    return <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-100">Loading Slide Studio...</div>;
  }

  if (!data) {
    return <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-100">Slide set not found.</div>;
  }

  const renderSlideFrame = (slideUrl: string, label: string, index: number) => {
    const fullUrl = getFullUrl(slideUrl);
    
    // Check if the URL is public or local
    const isLocal = fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1') || fullUrl.startsWith('/') || fullUrl.startsWith('.');
    
    // Prepare Microsoft Office Embed URL
    const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;

    return (
      <div className="flex flex-col h-full bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Slide Column Header */}
        <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700/60 flex items-center justify-between">
          <span className="font-bold text-sm text-indigo-400 uppercase tracking-wider">{label}</span>
          <div className="flex gap-1.5">
            <button 
              onClick={() => handleCopyLink(fullUrl, index)}
              className="p-1.5 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Copy Slide URL"
            >
              {copiedIndex === index ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <a 
              href={fullUrl} 
              download
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Download Slide (.pptx)"
            >
              <Download size={14} />
            </a>
          </div>
        </div>

        {/* Slide Column Body */}
        <div className="flex-1 bg-slate-950 relative min-h-[350px]">
          {isLocal ? (
            /* Local Mockup Display - since Microsoft embed server cannot reach localhost */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Monitor size={32} />
              </div>
              <h4 className="font-bold text-white mb-2 text-sm">Local Presentation Link</h4>
              <p className="text-xs text-slate-400 max-w-[200px] mb-4 leading-relaxed">
                Web presentation preview requires a public URL. Download pptx to view locally.
              </p>
              <a 
                href={fullUrl} 
                download
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-500/10 transition-colors"
              >
                <Download size={12} /> Download Presentation
              </a>
            </div>
          ) : (
            /* Public Iframe Embed using MS Office Web Viewer */
            <iframe 
              src={embedUrl}
              className="w-full h-full border-0 absolute top-0 left-0"
              title={label}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/review-slides')} 
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white truncate max-w-xl">{data.title}</h1>
            <p className="text-[10px] text-slate-400 font-medium flex gap-2">
              <span>Comparative Slide Review Suite</span> &bull; <span>Uploaded by {data.uploaded_by_email}</span>
            </p>
          </div>
        </div>
        
        <span className="text-xs uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold">
          Side-by-Side Presentation
        </span>
      </header>

      {/* Main content - Side-by-side Viewer (Top) + Comments (Bottom) */}
      <div className="flex-1 min-h-0 flex flex-col p-6 gap-6 overflow-y-auto">
        
        {/* Side-by-Side Slides (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 h-[480px]">
          {renderSlideFrame(data.client_slide_url, "Client Slide", 0)}
          {renderSlideFrame(data.production_slide_url, "Production Slide", 1)}
          {renderSlideFrame(data.recreated_slide_url, "Recreated Slide", 2)}
        </div>

        {/* Comments Feed Section */}
        <div className="flex-1 bg-slate-800/40 border border-slate-800 rounded-3xl flex flex-col overflow-hidden min-h-[300px] shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700/60 bg-slate-800/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Review Comments & Revision Feedback</h3>
            <span className="text-xs bg-slate-700/40 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700/60">
              {data.comments.length} Comments
            </span>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {data.comments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                No comment feedback entered yet. Admin, type below to submit revision remarks.
              </div>
            ) : (
              data.comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-slate-850 p-4 rounded-2xl border border-slate-800/80 text-sm flex flex-col gap-2 relative group/comment shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px]">U</div>
                      {comment.user}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      
                      {/* Edit/Delete controls */}
                      {(user?.email === comment.user || user?.role === 'admin') && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                          {user?.email === comment.user && (
                            <button
                              onClick={() => startEditing(comment.id, comment.text)}
                              className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                              title="Edit Comment"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Delete Comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="mt-1 flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button 
                          onClick={cancelEditing}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors font-bold"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleUpdateComment(comment.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-md shadow-indigo-500/10"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                  )}
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Submission Form */}
          <div className="p-4 bg-slate-800/80 border-t border-slate-700/60">
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter presentation slide comment/revision note..."
                className="flex-1 bg-slate-900 border border-slate-750 rounded-2xl px-5 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 transition-colors cursor-pointer"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SlideReviewStudio;
