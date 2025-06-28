"use client";
import GoogleSignInButton from "../../components/GoogleSignInButton";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 flex flex-col items-center">
        <img src="/logo.svg" alt="Sportal Logo" width={96} height={96} className="mb-3 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer" />
        <span className="text-4xl font-extrabold tracking-tight text-white mb-1">Sportal</span>
        <span className="text-lg text-[#49C5B6] font-medium mb-2">Game on!</span>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-white">Sign up or Log in</h1>
      <GoogleSignInButton />
    </div>
  );
} 