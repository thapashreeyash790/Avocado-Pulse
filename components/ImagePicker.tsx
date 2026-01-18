
import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { searchPhotos, getRandomPhotos, UnsplashPhoto, triggerDownload } from '../services/unsplash';

interface ImagePickerProps {
    onSelect: (imageUrl: string) => void;
    onClose: () => void;
    currentImage?: string;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onSelect, onClose, currentImage }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'url' | 'upload'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState(currentImage || '');

    useEffect(() => {
        loadRandomPhotos();
    }, []);

    const loadRandomPhotos = async () => {
        setLoading(true);
        const randomPhotos = await getRandomPhotos(12);
        setPhotos(randomPhotos);
        setLoading(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        const results = await searchPhotos(searchQuery, 1, 12);
        setPhotos(results);
        setLoading(false);
    };

    const handleSelectPhoto = (photo: UnsplashPhoto) => {
        triggerDownload(photo.links.download_location);
        onSelect(photo.urls.regular);
        onClose();
    };

    const handleCustomUrl = () => {
        if (customUrl.trim()) {
            onSelect(customUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Select Image</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose from stock photos or add your own URL</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ICONS.X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-6">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'search'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ICONS.Search size={16} />
                            Stock Photos
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'url'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ICONS.Link size={16} />
                            Image URL
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'upload'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ICONS.Upload size={16} />
                            Upload
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'search' && (
                        <div>
                            <form onSubmit={handleSearch} className="mb-6">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search for images (e.g., business, nature, technology)..."
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {photos.map((photo) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => handleSelectPhoto(photo)}
                                            className="group relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:ring-4 hover:ring-green-500 transition-all"
                                        >
                                            <img
                                                src={photo.urls.small}
                                                alt={photo.alt_description || 'Image'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <p className="text-white text-xs font-medium truncate">
                                                        Photo by {photo.user.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!loading && photos.length === 0 && (
                                <div className="text-center py-20">
                                    <ICONS.Image size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No images found. Try a different search term.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'url' && (
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            {customUrl && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Preview</p>
                                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={customUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleCustomUrl}
                                disabled={!customUrl.trim()}
                                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Use This Image
                            </button>
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                                <ICONS.Upload size={48} className="text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    File Upload Coming Soon
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Direct file upload will be available in a future update.
                                </p>
                                <p className="text-sm text-gray-400">
                                    For now, please use the "Image URL" tab to add images from external sources.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-500 text-center">
                        Stock photos powered by{' '}
                        <a
                            href="https://unsplash.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline font-semibold"
                        >
                            Unsplash
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImagePicker;
