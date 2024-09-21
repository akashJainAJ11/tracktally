'use client'

import { signIn } from "next-auth/react"

export default function SignInButton() {
    return (
        <div className="flex items-center justify-center h-screen">
            <button
                onClick={() => signIn('google')}
                className="bg-blue-500 text-white px-6 py-3 rounded shadow-lg transition hover:bg-blue-600"
            >
                Sign in with Google
            </button>
        </div>
    )
}
