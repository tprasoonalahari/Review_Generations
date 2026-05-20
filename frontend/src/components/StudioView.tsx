import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Send, X, FileText, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: string;
  parent_id?: string | null;
  text: string;
  user: string;
  created_at: string;
}

interface GenerationData {
  publication: {
    title: string;
    pdf_url: string;
  };
  generation: {
    id: string;
    audience_level: string;
    asset_type: string;
    generation_url: string;
  };
  comments: Comment[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StudioView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<GenerationData | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(true);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
      await api.put(`/review/comments/${commentId}`, { comment_text: editingText });
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
      await api.delete(`/review/comments/${commentId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await api.post(`/review/${id}/comments`, { 
        comment_text: replyText,
        parent_id: parentId 
      });
      setReplyText('');
      setReplyingToId(null);
      fetchData();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await api.get(`/review/${id}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTo({
        top: commentsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [data?.comments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/review/${id}/comments`, { comment_text: newComment });
      setNewComment('');
      fetchData();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };


  if (loading) {
    return <div className="h-screen bg-background flex items-center justify-center text-text">Loading Studio...</div>;
  }

  if (!data) {
    return <div className="h-screen bg-background flex items-center justify-center text-text">Asset not found.</div>;
  }

  const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const renderAssetPlayer = () => {
    const url = getFullUrl(data.generation.generation_url);
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov')) {
      return (
        <video controls className="absolute inset-0 w-full h-full object-contain bg-black">
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav')) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <audio controls className="w-full max-w-md">
            <source src={url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) {
      return (
        <div className="absolute inset-0 overflow-auto flex items-center justify-center bg-surface">
          <img src={url} alt="Generated Asset" className="max-w-full max-h-full object-contain" />
        </div>
      );
    } else if (lowerUrl.endsWith('.pdf')) {
      return (
        <iframe 
          src={url} 
          className="absolute inset-0 w-full h-full border-0"
          title="Asset Preview"
        />
      );
    } else {
      // Use Microsoft Office Viewer for Office files, fallback to Google Docs for others
      let viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      
      if (lowerUrl.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/)) {
        viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      }
      
      return (
        <div className="absolute inset-0 flex flex-col h-full bg-surface text-text" ref={iframeContainerRef}>
          <div className="flex-1 relative w-full bg-white">
            <iframe 
              src={viewerUrl}
              className="w-full h-full border-0 absolute top-0 left-0"
              title="Asset Preview"
            />
          </div>
          <div className="p-4 bg-background border-t border-border flex justify-end shrink-0">
            <div className="flex gap-3">
              <button onClick={toggleFullscreen} className="bg-surface hover:bg-gray-100 border border-border text-text px-4 py-2 rounded text-sm transition-colors cursor-pointer">
                View Fullscreen
              </button>
              <a href={url} download target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm transition-colors">
                Download Asset
              </a>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-text overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/workspace')} className="text-text-muted hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-text font-bold text-lg truncate max-w-xl">{data.publication.title}</h1>
            <div className="text-xs text-text-muted flex gap-2 font-medium">
              <span className="uppercase tracking-wider">{data.generation.asset_type}</span> &bull; <span>{data.generation.audience_level}</span>
            </div>
          </div>
        </div>
        {!isPdfOpen && (
          <button 
            onClick={() => setIsPdfOpen(true)}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
          >
            <FileText size={18} /> Show Source PDF
          </button>
        )}
      </header>

      {/* Main Grid Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 h-[calc(100vh-4rem)] p-6 bg-background">
        {/* Left Panel - PDF Viewer (Col span 5) */}
        {isPdfOpen && (
          <div className="col-span-5 flex flex-col h-full">
            <div className="mb-3 text-xs font-bold tracking-widest uppercase text-text-muted flex justify-between items-center">
              <span>Source Reference (PDF)</span>
              <button onClick={() => setIsPdfOpen(false)} className="text-text-muted hover:text-text transition-colors" title="Close PDF Panel">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-surface rounded-md shadow-xl border border-border overflow-hidden relative">
              <iframe 
                src={getFullUrl(data.publication.pdf_url)} 
                className="absolute inset-0 w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
          </div>
        )}

        {/* Middle Panel - Asset Viewer */}
        <div className={`${isPdfOpen ? 'col-span-4' : 'col-span-9'} flex flex-col h-full`}>
          <div className="mb-3 text-xs font-bold tracking-widest uppercase text-text-muted flex justify-between items-center">
            <span>Generated Asset</span>
          </div>
          <div key={isPdfOpen ? 'open' : 'closed'} className="flex-1 bg-surface rounded-md shadow-xl border border-border overflow-hidden relative">
            {renderAssetPlayer()}
          </div>
        </div>

        {/* Right Panel - Comments (Col span 3) */}
        <div className="col-span-3 flex flex-col h-full">
          <div className="mb-3 text-xs font-bold tracking-widest uppercase text-text-muted">Review Comments</div>
          <div className="flex-1 bg-white rounded-md shadow-xl border border-border flex flex-col overflow-hidden">
            <div ref={commentsContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {data.comments.length === 0 ? (
              <p className="text-text-muted text-sm text-center mt-8 italic">No comments yet. Start the review!</p>
            ) : (
              data.comments
                .filter(comment => !comment.parent_id)
                .map(rootComment => {
                  const replies = data.comments.filter(reply => reply.parent_id === rootComment.id);
                  return (
                    <div key={rootComment.id} className="bg-slate-50 p-4 rounded-md text-sm border border-slate-200 shadow-sm flex flex-col gap-3 group/comment">
                      {/* Root Comment content */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-primary truncate w-[55%]" title={rootComment.user}>{rootComment.user}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-text-muted font-medium">{new Date(rootComment.created_at).toLocaleDateString()}</span>
                            {(user?.email === rootComment.user || user?.role === 'admin') && (
                              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                {user?.email === rootComment.user && (
                                  <button 
                                    onClick={() => startEditing(rootComment.id, rootComment.text)}
                                    className="text-text-muted hover:text-primary transition-colors p-0.5 rounded hover:bg-slate-200/50"
                                    title="Edit Comment"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteComment(rootComment.id)}
                                  className="text-text-muted hover:text-red-500 transition-colors p-0.5 rounded hover:bg-slate-200/50"
                                  title="Delete Comment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {editingCommentId === rootComment.id ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2 border border-border rounded-md bg-white text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={cancelEditing} 
                                className="px-2.5 py-1 text-xs border border-border rounded text-text-muted hover:bg-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleUpdateComment(rootComment.id)} 
                                className="px-2.5 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover transition-colors font-semibold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-text break-words leading-relaxed whitespace-pre-wrap">{rootComment.text}</p>
                            <div className="mt-1.5 flex gap-3">
                              <button 
                                onClick={() => {
                                  setReplyingToId(rootComment.id);
                                  setReplyText('');
                                }}
                                className="text-xs text-primary/80 hover:text-primary font-semibold transition-colors"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nested Replies */}
                      {replies.length > 0 && (
                        <div className="flex flex-col gap-2.5 mt-1 pl-3 border-l-2 border-slate-200">
                          {replies.map(reply => (
                            <div key={reply.id} className="bg-white p-3 rounded-md border border-slate-100 shadow-2xs group/reply">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-text-muted text-xs truncate w-[50%]" title={reply.user}>{reply.user}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-text-muted/70">{new Date(reply.created_at).toLocaleDateString()}</span>
                                  {(user?.email === reply.user || user?.role === 'admin') && (
                                    <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                      {user?.email === reply.user && (
                                        <button 
                                          onClick={() => startEditing(reply.id, reply.text)}
                                          className="text-text-muted hover:text-primary transition-colors p-0.5 rounded hover:bg-slate-100"
                                          title="Edit Reply"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="text-text-muted hover:text-red-500 transition-colors p-0.5 rounded hover:bg-slate-100"
                                        title="Delete Reply"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === reply.id ? (
                                <div className="mt-1.5 flex flex-col gap-1.5">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 border border-border rounded-md bg-white text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={cancelEditing} 
                                      className="px-2 py-0.5 text-[10px] border border-border rounded text-text-muted hover:bg-slate-50 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateComment(reply.id)} 
                                      className="px-2 py-0.5 text-[10px] bg-primary text-white rounded hover:bg-primary-hover transition-colors font-semibold"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-text text-xs break-words leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Form inline */}
                      {replyingToId === rootComment.id && (
                        <form onSubmit={(e) => handleReplySubmit(e, rootComment.id)} className="flex gap-1.5 mt-1 pt-1.5 border-t border-slate-100">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-white border border-border rounded-md px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            autoFocus
                          />
                          <button 
                            type="submit" 
                            disabled={!replyText.trim()}
                            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Reply
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setReplyingToId(null)}
                            className="border border-border text-text-muted hover:bg-slate-100 px-2 py-1.5 rounded-md text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })
            )}
          </div>
          <div className="p-4 bg-white border-t border-border shrink-0">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-slate-50 border border-border rounded-md px-5 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="bg-gradient-to-r from-primary to-[#00c6ff] hover:from-primary-hover hover:to-primary disabled:opacity-50 text-white p-3 rounded-md flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default StudioView;
