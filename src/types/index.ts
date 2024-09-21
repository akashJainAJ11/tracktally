export interface User {
    id: number;
    email: string;
    name: string | null;
}

export interface QueueItem {
    id: number;
    youtubeUrl: string;
    title: string | null;
    thumbnailUrl: string | null;
    addedById: number;
    upvotes: number;
    downvotes: number;
    addedAt: Date;
    addedBy: {
        name: string | null;
        email: string;
    };
}

export interface VoteResult {
    upvotes: number;
    downvotes: number;
}