import React from 'react';
import { vote } from '@/server-actions/queue-actions';
import { QueueItem as QueueItemType, VoteResult } from '@/types';

interface QueueItemProps {
    item: QueueItemType;
    onVote: (newVotes: VoteResult) => void;
}

export default function QueueItem({ item, onVote }: QueueItemProps) {
    const handleVote = async (voteType: boolean) => {
        try {
            const newVotes = await vote(item.id, voteType);
            onVote(newVotes);
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-md flex flex-col sm:flex-row items-center sm:items-start sm:justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-4 sm:mb-0">
                <img src={item.thumbnailUrl || undefined} alt={item.title || 'Video thumbnail'} className="w-full sm:w-24 h-auto sm:h-16 rounded-md mb-2 sm:mb-0 sm:mr-4" />
                <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl">{item.title}</h3>
                    <p className="text-gray-400">Added by: {item.addedBy.name}</p>
                </div>
            </div>
            <div className="flex">
                <button onClick={() => handleVote(true)} className="bg-green-500 text-white px-3 py-1 rounded mr-2">Upvote ({item.upvotes})</button>
                <button onClick={() => handleVote(false)} className="bg-red-500 text-white px-3 py-1 rounded">Downvote ({item.downvotes})</button>
            </div>
        </div>
    );
}