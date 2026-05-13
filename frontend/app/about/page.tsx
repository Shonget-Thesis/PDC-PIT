import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0a07] via-[#1a1410] to-[#2d1f15]">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-6 border-b border-[#ff6b35]/20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ff8a5a] flex items-center justify-center font-bold text-white">SY</div>
          <h1 className="text-3xl font-bold tracking-tight text-white group-hover:text-[#ff6b35] transition-colors" style={{ fontFamily: "'Google Sans', sans-serif" }}>SYNCED</h1>
        </Link>
        <nav className="flex gap-8 text-sm">
          <Link href="/about" className="text-[#ff6b35] font-medium transition-colors">About</Link>
          <Link href="/rules" className="text-white/70 hover:text-white transition-colors">Rules</Link>
          <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-12">
        <div className="bg-[#1a1410]/60 backdrop-blur-md border border-[#ff6b35]/30 rounded-2xl p-8 md:p-12 hover:border-[#ff6b35]/60 transition-colors">
          <h2 className="text-5xl font-bold text-white mb-8" style={{ fontFamily: "'Google Sans', sans-serif" }}>About SYNCED</h2>
          <div className="space-y-8 text-white/90">
            <p className="text-lg leading-relaxed">
              SYNCED is an academic peer connection platform that helps students find study partners and mentors from different programs and year levels.
              No sign-up required, no personal information needed - just select your program and start connecting.
            </p>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Features</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Anonymous voice calls with random strangers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Real-time text chat alongside voice communication</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Skip to next person if the conversation isn&apos;t right for you</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Secure peer-to-peer WebRTC connections</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>No registration or personal data required</span>
                </li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>How It Works</h3>
              <ol className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold min-w-fit">1.</span>
                  <span>Click &quot;Start Call&quot; to begin</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold min-w-fit">2.</span>
                  <span>Grant microphone access when prompted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold min-w-fit">3.</span>
                  <span>Wait briefly while we find you a partner</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold min-w-fit">4.</span>
                  <span>Enjoy your conversation with voice and text chat</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold min-w-fit">5.</span>
                  <span>Click &quot;Skip&quot; to move to the next person, or &quot;End Call&quot; when done</span>
                </li>
              </ol>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Our Mission</h3>
              <p className="text-lg leading-relaxed">
                We believe in the power of human connection. SYNCED creates a space where people can have genuine, 
                spontaneous conversations without the pressure of social profiles or permanent records. 
                Every conversation is temporary, making each moment authentic and meaningful.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Technology</h3>
              <p className="text-lg leading-relaxed">
                Built with modern web technologies including Next.js, React, and WebRTC, SYNCED provides 
                a fast, secure, and reliable platform for anonymous communication. Our peer-to-peer architecture 
                ensures that your conversations remain private and are never stored on our servers.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm py-8 border-t border-[#ff6b35]/10 mt-8">
        <p>Academic connection through voice is a science.</p>
        <p className="mt-2">Stay respectful. Collaborate meaningfully.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} SYNCED. All rights reserved.</p>
      </footer>
    </div>
  );
}
