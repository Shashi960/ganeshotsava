import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api, { getImageUrl } from '../services/api';
import { Image, Video as VideoIcon, Play, X, AlertCircle } from 'lucide-react';

interface PhotoItem {
  _id: string;
  image: string;
  caption?: string;
  category?: string;
}

interface VideoItem {
  _id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export const MediaView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {activeTab === 'photos' ? t('navGallery') : t('navVideos')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Relive Ganeshotsava celebrations through community photos and YouTube videos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-warm-dark pb-4 gap-4">
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

      {/* Gallery Render */}
      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading gallery assets...</div>
      ) : activeTab === 'photos' ? (
        photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((ph) => (
              <div
                key={ph._id}
                onClick={() => setActiveLightbox(getImageUrl(ph.image))}
                className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm hover:shadow cursor-pointer relative group aspect-square"
              >
                <img src={getImageUrl(ph.image)} alt={ph.caption} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                {ph.caption && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition duration-300">
                    <p className="text-white text-xs font-semibold line-clamp-2">{ph.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light font-semibold">
            No photos uploaded yet.
          </div>
        )
      ) : (
        videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid) => (
              <div
                key={vid._id}
                onClick={() => setActiveVideoEmbed(vid.youtubeVideoId)}
                className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm hover:shadow cursor-pointer relative group flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={getImageUrl(vid.thumbnail)} alt={vid.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/45 transition">
                    <div className="h-12 w-12 bg-accent text-primary-dark rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 space-y-1">
                  <h3 className="font-bold text-charcoal text-base line-clamp-1 group-hover:text-primary transition">
                    {vid.title}
                  </h3>
                  {vid.description && (
                    <p className="text-xs text-charcoal-light line-clamp-2 leading-relaxed">
                      {vid.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light font-semibold">
            No videos uploaded yet.
          </div>
        )
      )}

      {/* Photo Lightbox Dialog */}
      {activeLightbox && (
        <div
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button className="absolute top-4 right-4 text-white hover:text-accent transition">
            <X className="h-8 w-8" />
          </button>
          <img src={getImageUrl(activeLightbox)} alt="Enlarged gallery asset" className="max-h-full max-w-full object-contain rounded shadow-2xl" />
        </div>
      )}

      {/* Video Watch Overlay */}
      {activeVideoEmbed && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded shadow-2xl overflow-hidden">
            <button
              onClick={() => setActiveVideoEmbed(null)}
              className="absolute -top-12 sm:top-2 right-2 text-white hover:text-accent transition z-[10001] bg-black/50 p-1.5 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideoEmbed}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};
