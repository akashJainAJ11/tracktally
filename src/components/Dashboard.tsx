import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import YouTubeForm from './YouTubeForm';
import QueueItem from './QueueItem';
import { getQueue, getHighestUpvotedVideo, removeVideoFromQueue } from '@/server-actions/queue-actions';
import { QueueItem as QueueItemType } from '@/types';
import YouTube from 'react-youtube';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [queue, setQueue] = useState<QueueItemType[]>([]);
    const [currentVideo, setCurrentVideo] = useState<QueueItemType | null>(null);
    const [isRequestPending, setIsRequestPending] = useState(false);

    const fetchQueueAndVideo = async () => {
        if (isRequestPending) return;
        setIsRequestPending(true);

        try {
            const queueData = await getQueue();
            setQueue(queueData);

            if (!currentVideo) {
                const highestUpvotedVideo = await getHighestUpvotedVideo();
                setCurrentVideo(highestUpvotedVideo);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsRequestPending(false);  // Unlock requests after completion
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchQueueAndVideo();
            const interval = setInterval(fetchQueueAndVideo, 5000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const handleVideoEnd = async () => {
        if (currentVideo) {
            await removeVideoFromQueue(currentVideo.id);
        }
        const nextVideo = await getHighestUpvotedVideo();
        setCurrentVideo(nextVideo);
        fetchQueueAndVideo();
    };

    if (status === "loading") {
        return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div className="flex items-center justify-center h-screen text-white">Please sign in to access the dashboard.</div>;
    }

    const opts = {
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
        },
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4">
            <h1 className="text-2xl sm:text-3xl mb-4">Welcome, {session?.user?.name}</h1>
            <div className="mb-6">
                <h2 className="text-xl sm:text-2xl mb-2">Now Playing</h2>
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] mb-4">
                    {currentVideo ? (
                        <YouTube
                            videoId={currentVideo.youtubeUrl.split('v=')[1]}
                            opts={opts}
                            onEnd={handleVideoEnd}
                            className="absolute w-full h-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center bg-gray-800 rounded-lg w-full h-full">
                            <p>No video currently playing</p>
                        </div>
                    )}
                </div>
            </div>

            <YouTubeForm onAdd={(newItem: QueueItemType) => setQueue([...queue, newItem])} />
            <div>
                <h2 className="text-xl sm:text-2xl mt-6 mb-2">Queue</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {queue.map((item) => (
                        <QueueItem
                            key={item.id}
                            item={item}
                            onVote={(newVotes) => {
                                setQueue(queue.map(qItem =>
                                    qItem.id === item.id ? { ...qItem, ...newVotes } : qItem
                                ));
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
