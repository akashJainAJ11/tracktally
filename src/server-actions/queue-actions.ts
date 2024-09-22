'use server'

import { unstable_noStore as noStore } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/route';
import prisma from '@/lib/db';
import { getVideoInfo } from '@/lib/youtube';
import { QueueItem, VoteResult } from '@/types';

export async function addToQueue(youtubeUrl: string): Promise<QueueItem> {
    noStore();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            throw new Error('You must be signed in to add to the queue');
        }

        let videoInfo;
        try {
            videoInfo = await getVideoInfo(youtubeUrl);
        } catch (error) {
            console.error('Error fetching video info:', error);
            throw new Error('Failed to fetch video information. Please check the URL and try again.');
        }

        const { title, thumbnailUrl } = videoInfo;

        const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
        if (!user) throw new Error('User not found');

        return await prisma.queue.create({
            data: {
                youtubeUrl,
                title,
                thumbnailUrl,
                addedById: user.id,
            },
            include: {
                addedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Error in addToQueue:', error);
        throw error;
    }
}

export async function vote(queueId: number, voteType: boolean): Promise<VoteResult> {
    noStore();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            throw new Error('You must be signed in to vote');
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
        if (!user) throw new Error('User not found');

        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_queueId: {
                    userId: user.id,
                    queueId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                });
            } else {
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { voteType },
                });
            }
        } else {
            await prisma.vote.create({
                data: {
                    userId: user.id,
                    queueId,
                    voteType,
                },
            });
        }

        const votes = await prisma.vote.groupBy({
            by: ['voteType'],
            where: { queueId },
            _count: true,
        });

        const upvotes = votes.find(v => v.voteType)?._count ?? 0;
        const downvotes = votes.find(v => !v.voteType)?._count ?? 0;

        await prisma.queue.update({
            where: { id: queueId },
            data: { upvotes, downvotes },
        });

        return { upvotes, downvotes };
    } catch (error) {
        console.error('Error in vote:', error);
        throw error;
    }
}

export async function getQueue(): Promise<QueueItem[]> {
    noStore();
    try {
        return await prisma.queue.findMany({
            orderBy: [
                { upvotes: 'desc' },
                { addedAt: 'asc' },
            ],
            include: {
                addedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Error in getQueue:', error);
        throw error;
    }
}

export async function getHighestUpvotedVideo(): Promise<QueueItem | null> {
    noStore();
    try {
        return await prisma.queue.findFirst({
            orderBy: [
                { upvotes: 'desc' },
                { addedAt: 'asc' },
            ],
            include: {
                addedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Error in getHighestUpvotedVideo:', error);
        throw error;
    }
}

export async function removeVideoFromQueue(id: number): Promise<void> {
    noStore();
    try {
        await prisma.queue.delete({
            where: { id },
        });
    } catch (error) {
        console.error('Error in removeVideoFromQueue:', error);
        throw error;
    }
}