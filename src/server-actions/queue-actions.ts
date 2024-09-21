'use server'

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/route';
import prisma from '@/lib/db';
import { getVideoInfo } from '@/lib/youtube';
import { QueueItem, VoteResult } from '@/types';

export async function addToQueue(youtubeUrl: string): Promise<QueueItem> {

    const session = await getServerSession(authOptions);
    console.log("session: ", session);

    if (!session || !session.user) {
        throw new Error('You must be signed in to add to the queue');
    }

    const { title, thumbnailUrl } = await getVideoInfo(youtubeUrl);

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) throw new Error('User not found');

    return prisma.queue.create({
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
}

export async function vote(queueId: number, voteType: boolean): Promise<VoteResult> {
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
            // Remove vote if it's the same type
            await prisma.vote.delete({
                where: { id: existingVote.id },
            });
        } else {
            // Update vote if it's a different type
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType },
            });
        }
    } else {
        // Create new vote
        await prisma.vote.create({
            data: {
                userId: user.id,
                queueId,
                voteType,
            },
        });
    }

    // Update queue item vote counts
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
}

export async function getQueue(): Promise<QueueItem[]> {
    return prisma.queue.findMany({
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
}

export async function getHighestUpvotedVideo(): Promise<QueueItem | null> {
    return prisma.queue.findFirst({
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
}

export async function removeVideoFromQueue(id: number): Promise<void> {
    await prisma.queue.delete({
        where: { id },
    });
}