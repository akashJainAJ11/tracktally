"use client"
import React, { useState } from 'react';
import { addToQueue } from '@/server-actions/queue-actions';
import { QueueItem } from '@/types';

interface YouTubeFormProps {
    onAdd: (newItem: QueueItem) => void;
}

export default function YouTubeForm({ onAdd }: YouTubeFormProps) {
    const [url, setUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newItem = await addToQueue(url);
            onAdd(newItem);
            setUrl('');
        } catch (error) {
            console.error('Error adding to queue:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center mb-6">
            <input
                type="text"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                required
                className="flex-grow w-full sm:w-auto p-2 rounded-md mb-2 sm:mb-0 sm:mr-2 bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
            />
            <button type="submit" className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded">Add to Queue</button>
        </form>
    );
}