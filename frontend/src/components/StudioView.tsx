import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Send } from 'lucide-react';

interface Comment {
  id: string;
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
  const [data, setData] = useState<GenerationData | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

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
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    const type = data.generation.asset_type;

    if (type === 'Video' || url.endsWith('.mp4')) {
      return (
        <video controls className="w-full h-full object-contain bg-black">
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (url.endsWith('.mp3')) {
      return (
        <div className="flex items-center justify-center h-full bg-surface">
          <audio controls className="w-full max-w-md">
            <source src={url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else if (type === 'Poster' || type === 'Infographic' || url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
      return (
        <div className="w-full h-full overflow-auto flex items-center justify-center bg-surface">
          <img src={url} alt="Generated Asset" className="max-w-full max-h-full object-contain" />
        </div>
      );
    } else {
      // For PPT or other unrenderable files natively, provide a Google Docs Viewer iframe + separate buttons
      const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      
      return (
        <div className="flex flex-col h-full bg-surface text-text" ref={iframeContainerRef}>
          <div className="flex-1 relative w-full bg-white">
            <iframe 
              src={googleDocsViewerUrl}
              className="w-full h-full border-0 absolute top-0 left-0"
              title="Asset Preview"
            />
          </div>
          <div className="p-4 bg-background border-t border-border flex flex-wrap justify-between items-center shrink-0">
            <div className="text-xs text-text-muted max-w-sm">
              Note: Preview uses Google Docs Viewer. The asset URL must be publicly accessible (not localhost) for the preview to load.
            </div>
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
      <header className="h-14 border-b border-border bg-surface flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workspace')} className="text-text-muted hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-text font-semibold truncate max-w-xl">{data.publication.title}</h1>
            <div className="text-xs text-text-muted flex gap-2">
              <span>{data.generation.asset_type}</span> &bull; <span>{data.generation.audience_level}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Grid */}
      <div className="flex-1 grid grid-cols-12 h-[calc(100vh-3.5rem)] bg-background">
        {/* Left Panel - PDF Viewer (Col span 5) */}
        <div className="col-span-5 border-r border-border bg-surface flex flex-col h-full">
          <div className="px-4 py-2 bg-surface/90 border-b border-border text-sm font-semibold sticky top-0 text-text">Source Reference (PDF)</div>
          <div className="flex-1 p-2 bg-background h-full">
            <iframe 
              src={getFullUrl(data.publication.pdf_url)} 
              className="w-full h-full border-0 bg-white rounded"
              title="PDF Viewer"
            />
          </div>
        </div>

        {/* Middle Panel - Asset Viewer (Col span 5) */}
        <div className="col-span-5 border-r border-border bg-background flex flex-col h-full">
          <div className="px-4 py-2 bg-surface/90 border-b border-border text-sm font-semibold sticky top-0 flex justify-between items-center text-text">
            <span>Generated Asset</span>
            <a href={getFullUrl(data.generation.generation_url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover text-xs font-semibold">Open Original</a>
          </div>
          <div className="flex-1 overflow-hidden h-full">
            {renderAssetPlayer()}
          </div>
        </div>

        {/* Right Panel - Comments (Col span 2) */}
        <div className="col-span-2 bg-surface flex flex-col h-full">
          <div className="px-4 py-2 bg-surface/90 border-b border-border text-sm font-semibold sticky top-0 text-text">Review Comments</div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {data.comments.length === 0 ? (
              <p className="text-text-muted text-sm text-center mt-4">No comments yet. Start the review!</p>
            ) : (
              data.comments.map(comment => (
                <div key={comment.id} className="bg-white p-3 rounded-lg text-sm border border-border shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-primary truncate w-3/4">{comment.user}</span>
                    <span className="text-xs text-text-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-text break-words">{comment.text}</p>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>
          <div className="p-4 bg-surface border-t border-border shrink-0">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 bg-white border border-border rounded-l px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-3 py-2 rounded-r flex items-center justify-center transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioView;
