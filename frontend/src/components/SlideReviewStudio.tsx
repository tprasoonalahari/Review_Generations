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
    return <div className="h-screen bg-background flex items-center justify-center text-text font-semibold">Loading Slide Studio...</div>;
  }

  if (!data) {
    return <div className="h-screen bg-background flex items-center justify-center text-text">Slide set not found.</div>;
  }

  const renderSlideFrame = (slideUrl: string, label: string, index: number) => {
    const fullUrl = getFullUrl(slideUrl);
    
    // Check if the URL is public or local
    const isLocal = fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1') || fullUrl.startsWith('/') || fullUrl.startsWith('.');
    
    // Prepare Microsoft Office Embed URL
    const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;

    return (
      <div className="flex flex-col h-full bg-white border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
        {/* Slide Column Header */}
        <div className="bg-slate-50 px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-[#0B3C88] uppercase tracking-wider">{label}</span>
          <div className="flex gap-1.5">
            <button 
              onClick={() => handleCopyLink(fullUrl, index)}
              className="p-1.5 hover:bg-slate-200/80 rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer"
              title="Copy Slide URL"
            >
              {copiedIndex === index ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
            <a 
              href={fullUrl} 
              download
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-slate-200/80 rounded-lg text-text-muted hover:text-text transition-colors"
              title="Download Slide (.pptx)"
            >
              <Download size={14} />
            </a>
          </div>
        </div>

        {/* Slide Column Body */}
        <div className="flex-1 bg-slate-50 relative min-h-[350px]">
          {isLocal ? (
            /* Local Mockup Display - since Microsoft embed server cannot reach localhost */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center mb-4">
                <Monitor size={32} />
              </div>
              <h4 className="font-bold text-[#0B3C88] mb-2 text-sm">Local Presentation Link</h4>
              <p className="text-xs text-text-muted max-w-[200px] mb-4 leading-relaxed">
                Web presentation preview requires a public URL. Download pptx to view locally.
              </p>
              <a 
                href={fullUrl} 
                download
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/10 transition-colors"
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
    <div className="h-screen bg-background text-text flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-border bg-white px-6 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/review-slides')} 
            className="p-2 bg-white hover:bg-slate-50 border border-border rounded-xl text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#0B3C88] truncate max-w-xl">{data.title}</h1>
            <p className="text-[10px] text-text-muted font-medium flex gap-2">
              <span>Comparative Slide Review Suite</span> &bull; <span>Uploaded by {data.uploaded_by_email}</span>
            </p>
          </div>
        </div>
        
        <span className="text-xs uppercase tracking-wider bg-[#0B3C88]/10 text-[#0B3C88] px-3.5 py-1.5 rounded-full border border-[#0B3C88]/10 font-bold">
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
        <div className="flex-1 bg-white border border-border rounded-3xl flex flex-col overflow-hidden min-h-[300px] shadow-xl shadow-blue-900/5">
          <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0B3C88] uppercase tracking-wider">Review Comments & Revision Feedback</h3>
            <span className="text-xs bg-blue-50 text-[#0B3C88] px-2.5 py-0.5 rounded-full border border-blue-100 font-bold">
              {data.comments.length} Comments
            </span>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-white">
            {data.comments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted italic text-sm">
                No comment feedback entered yet. Admin, type below to submit revision remarks.
              </div>
            ) : (
              data.comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-blue-50/10 p-4 rounded-2xl border border-blue-50/30 text-sm flex flex-col gap-2 relative group/comment shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0B3C88] text-xs flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0B3C88] border border-blue-100 flex items-center justify-center text-[9px] font-bold">U</div>
                      {comment.user}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted font-mono">
                        {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      
                      {/* Edit/Delete controls */}
                      {(user?.email === comment.user || user?.role === 'admin') && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                          {user?.email === comment.user && (
                            <button
                              onClick={() => startEditing(comment.id, comment.text)}
                              className="p-1 hover:bg-slate-100 text-text-muted hover:text-[#0B3C88] rounded transition-colors cursor-pointer"
                              title="Edit Comment"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 hover:bg-red-50 text-text-muted hover:text-red-500 rounded transition-colors cursor-pointer"
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
                        className="w-full p-3 bg-white border border-border rounded-xl text-text text-sm focus:outline-none focus:border-primary shadow-xs"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button 
                          onClick={cancelEditing}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-text-muted transition-colors font-bold"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleUpdateComment(comment.id)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0B3C88] to-primary text-white font-bold transition-colors shadow-md"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                  )}
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Submission Form */}
          <div className="p-4 bg-slate-50 border-t border-border">
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter presentation slide comment/revision note..."
                className="flex-1 bg-white border border-border rounded-2xl px-5 py-3 text-sm text-text focus:outline-none focus:border-primary placeholder-slate-400 transition-colors shadow-xs"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-gradient-to-r from-[#0B3C88] to-primary hover:from-[#072758] hover:to-primary text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
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
