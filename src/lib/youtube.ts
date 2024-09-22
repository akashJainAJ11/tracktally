import { getVideoTitle } from 'yt-get';

export function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export function getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

interface VideoInfo {
    videoId: string;
    title: string;
    thumbnailUrl: string;
}


export async function getVideoInfo(url: string): Promise<VideoInfo> {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const title = await getVideoTitle(videoId);
    const thumbnailUrl = getThumbnailUrl(videoId);

    return { videoId, title, thumbnailUrl };
}