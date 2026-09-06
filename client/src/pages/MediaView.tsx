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
  youtubeVideoId: string;
  title: string;
  year?: string;
}

export const MediaView: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setPlayingVideoId(null);
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
          {language === 'kn'
            ? 'ನಾಜಗಾರ ಗಣೇಶೋತ್ಸವದ ಸುಂದರ ಕ್ಷಣಗಳು ಹಾಗೂ ವೀಡಿಯೋಗಳು.'
            : 'Relive Ganeshotsava celebrations through community photos and YouTube videos.'}
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
          <span>{language === 'kn' ? 'ಚಿತ್ರಗಳು' : 'Photos'}</span>
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
          <span>{language === 'kn' ? 'ವೀಡಿಯೋಗಳು' : 'Videos'}</span>
        </button>
      </div>

      {/* Gallery Render */}
      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">
          {language === 'kn' ? 'ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading gallery assets...'}
        </div>
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
            {language === 'kn' ? 'ಯಾವುದೇ ಚಿತ್ರಗಳು ಲಭ್ಯವಿಲ್ಲ.' : 'No photos uploaded yet.'}
          </div>
        )
      ) : (
        videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid) => {
              const isPlaying = playingVideoId === vid._id;
              const thumbnailSrc = `https://img.youtube.com/vi/${vid.youtubeVideoId}/hqdefault.jpg`;

              return (
                <div
                  key={vid._id}
                  className="bg-white rounded-2xl border border-warm-dark overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  {/* 16:9 Click-to-Play YouTube Player */}
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
                        onClick={() => setPlayingVideoId(vid._id)}
                        className="w-full h-full relative block text-left group cursor-pointer focus:outline-none"
                        aria-label={`Play ${vid.title}`}
                      >
                        <img
                          src={thumbnailSrc}
                          alt={vid.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition duration-300" />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 bg-red-600 group-hover:bg-red-700 text-white rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition duration-200">
                            <Play className="w-7 h-7 fill-current ml-1" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex-1 space-y-1.5">
                    <h3 className="font-bold text-charcoal text-base leading-snug">
                      {vid.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light font-semibold">
            {language === 'kn' ? 'ಯಾವುದೇ ವಿಡಿಯೋಗಳು ಲಭ್ಯವಿಲ್ಲ.' : 'No videos uploaded yet.'}
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

    </div>
  );
};
