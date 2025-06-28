"use client";
import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="bg-[#49C5B6] border border-[#49C5B6] text-white rounded px-4 py-2 flex items-center gap-2 shadow hover:bg-[#38b0a3] transition"
    >
      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_17_40)">
          <path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.56 3.02-2.24 5.58-4.78 7.3v6.06h7.74c4.54-4.18 7.07-10.34 7.07-17.676z" fill="white" fillOpacity="0.85"/>
          <path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.74-6.06c-2.14 1.44-4.88 2.3-8.15 2.3-6.26 0-11.56-4.22-13.46-9.9H2.5v6.22C6.46 43.78 14.7 48 24.48 48z" fill="white" fillOpacity="0.85"/>
          <path d="M11.02 28.52A14.77 14.77 0 0 1 9.1 24c0-1.58.28-3.12.78-4.52v-6.22H2.5A23.98 23.98 0 0 0 0 24c0 3.98.96 7.76 2.5 11.22l8.52-6.7z" fill="white" fillOpacity="0.85"/>
          <path d="M24.48 9.54c3.52 0 6.64 1.22 9.12 3.62l6.82-6.82C36.4 2.14 30.96 0 24.48 0 14.7 0 6.46 4.22 2.5 10.78l8.52 6.7c1.9-5.68 7.2-9.9 13.46-9.9z" fill="white" fillOpacity="0.85"/>
        </g>
        <defs>
          <clipPath id="clip0_17_40">
            <path fill="#fff" d="M0 0h48v48H0z"/>
          </clipPath>
        </defs>
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
} 