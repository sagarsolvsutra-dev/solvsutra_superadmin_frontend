"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiHome } from "react-icons/fi";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="/logo-wordmark.jpg"
          alt="SolvSutra Software"
          width={200}
          height={40}
          className="mx-auto h-9 w-auto"
          priority
        />

        <p className="mt-10 text-8xl font-extrabold tracking-tight text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-bold text-ink">Page not found</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist, or may have moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex h-9.5 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <FiArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-9.5 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <FiHome className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
