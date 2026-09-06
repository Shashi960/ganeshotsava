import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api, { getImageUrl } from '../services/api';
import { Image, Video as VideoIcon, Plus, Trash2, X, Play, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface PhotoItem {
  _id: string;
  image: string;
  caption?: string;
  year: string;
  category?: string;
}

interface VideoItem {
  _id: string;
  youtubeVideoId: string;
  title: string;
  year: string;
  youtubeUrl?: string;
  description?: string;
  thumbnail?: string;
}

// Helper to extract and validate YouTube video ID from links (regular, shorts, youtu.be, embed, live)
const extractYouTubeVideoId = (inputUrl: string): string | null => {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const trimmed = inputUrl.trim();

  // If already a clean 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:youtube\.com\/(?:watch\?.*v=|v\/))([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
      return match[1];
    }
  }

  return null;
};

export const AdminGallery: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Photo Form fields
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoYear, setPhotoYear] = useState('2026');
  const [photoCategory, setPhotoCategory] = useState('Puja');
  const [uploading, setUploading] = useState(false);

  // Video Form fields
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoYear, setVideoYear] = useState('2026');
  const [playingAdminVideoId, setPlayingAdminVideoId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file is too large. Max limit is 5MB.', 'warning');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.post('/upload', { image: base64Data });
        if (res.data.status === 'success') {
          setPhotoUrl(res.data.url);
          showToast('Image uploaded successfully!', 'success');
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to upload image.', 'error');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      showToast('Error reading file.', 'error');
      setUploading(false);
    };
  };

  useEffect(() => {
    fetchMedia();
  }, [activeTab]);

  const fetchMedia = () => {
    setLoading(true);
    setPlayingAdminVideoId(null);
    if (activeTab === 'photos') {
      api.get('/gallery').then(res => {
        if (res.data.status === 'success') setPhotos(res.data.photos);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      api.get('/videos').then(res => {
        if (res.data.status === 'success') setVideos(res.data.videos);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      showToast('Please enter an image URL.', 'warning');
      return;
    }

    try {
      const res = await api.post('/gallery/new', {
        image: photoUrl,
        caption: photoCaption,
        year: photoYear,
        category: photoCategory
      });
      if (res.data.status === 'success') {
        showToast('Photo added successfully!');
        setIsPhotoModalOpen(false);
        setPhotoUrl('');
        setPhotoCaption('');
        fetchMedia();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to add photo.', 'error');
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !videoTitle) {
      showToast('Please enter video URL and Title.', 'warning');
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      showToast('Invalid YouTube URL. Please provide a valid link or 11-char Video ID.', 'warning');
      return;
    }

    try {
      // Send minimal required metadata: youtubeVideoId, title, year
      const res = await api.post('/videos/new', {
        youtubeVideoId: videoId,
        title: videoTitle,
        year: videoYear
      });
      if (res.data.status === 'success') {
        showToast('YouTube video linked successfully!');
        setIsVideoModalOpen(false);
        setVideoUrl('');
        setVideoTitle('');
        fetchMedia();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to add video.';
      showToast(msg, 'error');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      showToast('Photo deleted successfully.');
      fetchMedia();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete photo.', 'error');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      showToast('Video deleted successfully.');
      fetchMedia();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete video.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Media Gallery Manager</h1>
          <p className="text-xs text-charcoal-light">Upload celebration photos and link YouTube videos for visitors.</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'photos' ? (
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center gap-1.5 bg-primary text-warm font-bold px-4 py-2 rounded-lg hover:bg-primary-light transition shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Photo</span>
            </button>
          ) : (
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="flex items-center gap-1.5 bg-secondary text-warm font-bold px-4 py-2 rounded-lg hover:bg-secondary-light transition shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-warm-dark pb-4 gap-4">
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold uppercase transition ${
            activeTab === 'photos'
              ? 'bg-primary text-warm border border-primary'
              : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
          }`}
        >
          <Image className="h-4 w-4" />
          <span>Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold uppercase transition ${
            activeTab === 'videos'
              ? 'bg-primary text-warm border border-primary'
              : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
          }`}
        >
          <VideoIcon className="h-4 w-4" />
          <span>Videos</span>
        </button>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-12 text-center text-charcoal-light">Loading assets...</div>
      ) : activeTab === 'photos' ? (
        photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map(ph => (
              <div key={ph._id} className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm relative group aspect-square flex flex-col justify-between">
                <img src={getImageUrl(ph.image)} alt={ph.caption} className="h-full w-full object-cover" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleDeletePhoto(ph._id)}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition"
                    title="Delete Photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {ph.caption && (
                  <div className="p-3 border-t border-warm-dark bg-white">
                    <p className="text-xs font-bold text-charcoal truncate">{ph.caption}</p>
                    <p className="text-[10px] text-charcoal-light mt-0.5">Year: {ph.year}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-warm-dark p-8 rounded-xl text-center text-charcoal-light">
            No photos found in the gallery.
          </div>
        )
      ) : (
        videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(vid => {
              const isPlaying = playingAdminVideoId === vid._id;
              const thumbnailSrc = `https://img.youtube.com/vi/${vid.youtubeVideoId}/hqdefault.jpg`;

              return (
                <div key={vid._id} className="bg-white rounded-2xl border border-warm-dark overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  {/* 16:9 Click-to-Play Admin Preview Player */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid.youtubeVideoId)}?autoplay=1&rel=0&modestbranding=1`}
                        title={vid.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0 absolute inset-0"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPlayingAdminVideoId(vid._id)}
                        className="w-full h-full relative block text-left group cursor-pointer focus:outline-none"
                        title="Click to preview video"
                      >
                        <img
                          src={thumbnailSrc}
                          alt={vid.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-red-600 group-hover:bg-red-700 text-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-200">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex items-start justify-between gap-3 bg-white">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-charcoal text-sm truncate" title={vid.title}>{vid.title}</h3>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] bg-warm-dark/50 text-charcoal font-semibold px-2 py-0.5 rounded">
                          Year: {vid.year}
                        </span>
                        <span className="text-[10px] text-charcoal-light font-mono truncate">
                          ID: {vid.youtubeVideoId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVideo(vid._id)}
                      className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg border border-rose-200 hover:border-rose-600 transition shadow-sm flex-shrink-0"
                      title="Delete Video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-warm-dark p-8 rounded-xl text-center text-charcoal-light">
            No YouTube videos linked yet.
          </div>
        )
      )}

      {/* Add Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-warm-dark p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-dark pb-2">
              <h2 className="text-lg font-bold text-primary flex items-center gap-1.5">
                <Image className="h-5 w-5 text-accent-dark" />
                <span>Add Photo to Gallery</span>
              </h2>
              <button onClick={() => setIsPhotoModalOpen(false)}><X className="h-5 w-5 text-charcoal-light" /></button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4 text-sm text-charcoal">
              <div className="space-y-1">
                <label className="font-bold text-xs block">Choose Gallery Photo</label>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img src={getImageUrl(photoUrl)} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-warm-dark" />
                  ) : (
                    <div className="h-12 w-12 bg-warm border border-warm-dark rounded-lg flex items-center justify-center text-charcoal-light font-bold text-[10px] uppercase">No File</div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={uploading}
                      className="w-full text-xs text-charcoal-light file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-warm hover:file:bg-primary-light file:cursor-pointer cursor-pointer" 
                    />
                    <p className="text-[10px] text-charcoal-light font-medium">Or enter relative/external URL below:</p>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-2 h-3.5 w-3.5 text-charcoal-light" />
                      <input 
                        type="text" 
                        placeholder="e.g. /uploads/image.png" 
                        value={photoUrl} 
                        onChange={(e) => setPhotoUrl(e.target.value)} 
                        className="w-full bg-warm border border-warm-dark rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none" 
                      />
                    </div>
                  </div>
                </div>
                {uploading && <div className="text-xs text-primary animate-pulse mt-1">Uploading image...</div>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs">Caption / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Pooja ritual morning"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Festival Year</label>
                  <input
                    type="text"
                    value={photoYear}
                    onChange={(e) => setPhotoYear(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Asset Category</label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none"
                  >
                    {['Puja', 'Religious', 'Cultural', 'Community', 'Procession', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-dark pt-3">
                <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="px-4 py-2 border border-warm-dark rounded-lg text-charcoal hover:bg-warm transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-warm font-bold rounded-lg hover:bg-primary-light transition">Save Photo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {isVideoModalOpen && (() => {
        const detectedVideoId = extractYouTubeVideoId(videoUrl);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-warm-dark p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-warm-dark pb-2">
                <h2 className="text-lg font-bold text-secondary flex items-center gap-1.5">
                  <VideoIcon className="h-5 w-5 text-accent-dark" />
                  <span>Link YouTube Video</span>
                </h2>
                <button onClick={() => setIsVideoModalOpen(false)}><X className="h-5 w-5 text-charcoal-light" /></button>
              </div>

              <form onSubmit={handleAddVideo} className="space-y-4 text-sm text-charcoal">
                <div className="space-y-1">
                  <label className="font-bold text-xs">YouTube Video URL <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
                    <input
                      type="text"
                      required
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 outline-none text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-charcoal-light">
                    Supports standard links (<span className="font-mono">watch?v=</span>), short links (<span className="font-mono">youtu.be/</span>), Shorts (<span className="font-mono">shorts/</span>), or direct 11-char ID.
                  </p>
                  {detectedVideoId ? (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>Valid YouTube Video ID: <strong className="font-mono">{detectedVideoId}</strong></span>
                    </div>
                  ) : videoUrl.trim() ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                      Please enter a valid YouTube video link or 11-character video ID.
                    </p>
                  ) : null}
                </div>

                {/* Thumbnail Preview Before Saving */}
                {detectedVideoId && (
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-charcoal flex items-center justify-between">
                      <span>Video Preview</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Auto-generated from YouTube ID</span>
                    </label>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-warm-dark bg-black shadow-inner">
                      <img
                        src={`https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-xs">Video Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maha Mangala Arati & Procession"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-xs font-kannada">Festival Year</label>
                    <input
                      type="text"
                      value={videoYear}
                      onChange={(e) => setVideoYear(e.target.value)}
                      className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-warm-dark pt-3">
                  <button type="button" onClick={() => setIsVideoModalOpen(false)} className="px-4 py-2 border border-warm-dark rounded-lg text-charcoal hover:bg-warm transition">Cancel</button>
                  <button type="submit" disabled={!detectedVideoId} className="px-4 py-2 bg-secondary text-warm font-bold rounded-lg hover:bg-secondary-light transition disabled:opacity-50 disabled:cursor-not-allowed">Link Video</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
