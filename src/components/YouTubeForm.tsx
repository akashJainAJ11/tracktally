import React, { useState } from 'react';
import { addToQueue } from '@/server-actions/queue-actions';
import { toast } from 'react-toastify';

export default function YouTubeForm({ onAdd }: { onAdd: () => void }) {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addToQueue(url);
            setUrl('');
            onAdd();
            toast.success('Video added to queue successfully!');
        } catch (error) {
            console.error('Error adding video to queue:', error);
            if (error instanceof Error) {
                toast.error(error.message || 'Failed to add video to queue. Please try again.');
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className="w-full p-2 rounded bg-gray-700 text-white mb-2"
                required
            />
            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={isLoading}
            >
                {isLoading ? 'Adding...' : 'Add to Queue'}
            </button>
        </form>
    );
}