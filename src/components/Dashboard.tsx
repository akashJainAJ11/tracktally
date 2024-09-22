"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import YouTubeForm from './YouTubeForm';
import QueueItem from './QueueItem';
import { getQueue, getHighestUpvotedVideo, removeVideoFromQueue } from '@/server-actions/queue-actions';
import { QueueItem as QueueItemType } from '@/types';
import YouTube from 'react-youtube';
import useSWR from 'swr';


const fetchQueueData = async () => {
    return await getQueue();
};

const fetchHighestUpvotedVideo = async () => {
    return await getHighestUpvotedVideo();
};

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [currentVideo, setCurrentVideo] = useState<QueueItemType | null>(null);


    const { data: queue, mutate: mutateQueue } = useSWR('queue', fetchQueueData, {
        refreshInterval: 5000,
    });


    const { data: highestUpvotedVideo, mutate: mutateVideo } = useSWR('highestUpvotedVideo', fetchHighestUpvotedVideo);


    React.useEffect(() => {
        if (!currentVideo && highestUpvotedVideo) {
            setCurrentVideo(highestUpvotedVideo);
        }
    }, [highestUpvotedVideo, currentVideo]);

    const handleVideoEnd = async () => {
        if (currentVideo) {
            await removeVideoFromQueue(currentVideo.id);
            await mutateQueue();
            await mutateVideo();
        }
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


            <YouTubeForm onAdd={async () => {
                await mutateQueue();
            }} />

            <div>
                <h2 className="text-xl sm:text-2xl mt-6 mb-2">Queue</h2>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {queue?.map((item) => (
                        <QueueItem
                            key={item.id}
                            item={item}

                            onVote={async () => {
                                await mutateQueue();
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
