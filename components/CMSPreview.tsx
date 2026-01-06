import React, { useEffect, useState } from 'react';
import DynamicLandingPage from './DynamicLandingPage';
import { CMSPage } from '../types';

const CMSPreview: React.FC = () => {
    const [previewData, setPreviewData] = useState<CMSPage | null>(null);

    useEffect(() => {
        const storedData = localStorage.getItem('cms_preview_data');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                setPreviewData(parsed);
            } catch (e) {
                console.error("Failed to parse preview data", e);
            }
        }
    }, []);

    if (!previewData) {
        return (
            <div className="flex items-center justify-center p-20 text-gray-500 font-sans">
                Loading preview or no data found...
            </div>
        );
    }

    // Render in read-only mode (isEditing=false)
    return <DynamicLandingPage isEditing={false} pageData={previewData} />;
};

export default CMSPreview;
