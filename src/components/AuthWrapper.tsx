'use client'

import React from 'react';
import { useSession } from "next-auth/react";
import SignInButton from './SignInButton';
import Dashboard from './Dashboard';

export default function AuthWrapper() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
    }

    return session ? <Dashboard /> : <SignInButton />;
}
