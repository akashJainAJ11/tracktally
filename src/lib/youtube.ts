import fetch from 'node-fetch';

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

export async function getVideoTitle(videoId: string): Promise<string> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url);
    const html = await response.text();

    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/);
    if (titleMatch && titleMatch[1]) {
        return titleMatch[1];
    } else {
        throw new Error('Video title not found');
    }
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const title = await getVideoTitle(videoId);
    const thumbnailUrl = getThumbnailUrl(videoId);

    return { videoId, title, thumbnailUrl };
}
