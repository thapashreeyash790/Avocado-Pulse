// Unsplash API Service for fetching stock images
const UNSPLASH_ACCESS_KEY = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashPhoto {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    description: string | null;
    user: {
        name: string;
        username: string;
    };
    links: {
        download_location: string;
    };
}

export const searchPhotos = async (query: string, page = 1, perPage = 12): Promise<UnsplashPhoto[]> => {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn('Unsplash API key not configured. Using placeholder images.');
        return getPlaceholderImages(query, perPage);
    }

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Unsplash API error:', error);
        return getPlaceholderImages(query, perPage);
    }
};

export const getRandomPhotos = async (count = 12): Promise<UnsplashPhoto[]> => {
    if (!UNSPLASH_ACCESS_KEY) {
        return getPlaceholderImages('random', count);
    }

    try {
        const response = await fetch(
            `${UNSPLASH_API_URL}/photos/random?count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }

        return await response.json();
    } catch (error) {
        console.error('Unsplash API error:', error);
        return getPlaceholderImages('random', count);
    }
};

// Fallback placeholder images when API key is not available
const getPlaceholderImages = (query: string, count: number): UnsplashPhoto[] => {
    const placeholders = [
        'photo-1460925895917-afdab827c52f', // Business
        'photo-1522071820081-009f0129c71c', // Team
        'photo-1557804506-669a67965ba0', // Office
        'photo-1551434678-e076c223a692', // Laptop
        'photo-1542744173-8e7e53415bb0', // Workspace
        'photo-1519389950473-47ba0277781c', // Technology
        'photo-1553877522-43269d4ea984', // Meeting
        'photo-1556761175-b413da4baf72', // Analytics
        'photo-1504868584819-f8e8b4b6d7e3', // Design
        'photo-1531482615713-2afd69097998', // Startup
        'photo-1552664730-d307ca884978', // Success
        'photo-1573164713714-d95e436ab8d6', // Growth
    ];

    return Array.from({ length: count }, (_, i) => {
        const photoId = placeholders[i % placeholders.length];
        return {
            id: `placeholder-${i}`,
            urls: {
                raw: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`,
                full: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`,
                regular: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`,
                small: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&q=80`,
                thumb: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=200&q=80`,
            },
            alt_description: `${query} image ${i + 1}`,
            description: null,
            user: {
                name: 'Unsplash',
                username: 'unsplash',
            },
            links: {
                download_location: '',
            },
        };
    });
};

export const triggerDownload = async (downloadLocation: string) => {
    if (!UNSPLASH_ACCESS_KEY || !downloadLocation) return;

    try {
        await fetch(`${downloadLocation}?client_id=${UNSPLASH_ACCESS_KEY}`);
    } catch (error) {
        console.error('Failed to trigger download:', error);
    }
};
