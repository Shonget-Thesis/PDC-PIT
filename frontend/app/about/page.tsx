import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1 px-3 py-4 mb-2 mt-1 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-4xl font-bold tracking-wide text-white">Spark</h1>
        </Link>
        <nav className="flex gap-8 text-sm mr-8">
          <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
          <Link href="/rules" className="text-white/80 hover:text-white transition-colors">Rules</Link>
          <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto">
        <div className="bg-[#2d3a2d]/50 backdrop-blur-sm border border-[#4a5d4a] rounded-2xl p-8 md:p-12">
          <h2 className="text-4xl font-light text-white mb-8">About Spark</h2>
          <div className="space-y-6 text-white/80">
            <p className="text-lg">
              Spark is an anonymous voice chat platform that connects you with random strangers from around the world. 
              No sign-up required, no personal information needed - just click and start talking.
            </p>
            
            <h3 className="text-2xl font-medium text-white mt-8">Features</h3>
            <ul className="list-disc list-inside space-y-3 text-lg">
              <li>Anonymous voice calls with random strangers</li>
              <li>Real-time text chat alongside voice communication</li>
              <li>Skip to next person if the conversation isn't right for you</li>
              <li>Secure peer-to-peer WebRTC connections</li>
              <li>No registration or personal data required</li>
            </ul>
            
            <h3 className="text-2xl font-medium text-white mt-8">How It Works</h3>
            <ol className="list-decimal list-inside space-y-3 text-lg">
              <li>Click "Start Call" to begin</li>
              <li>Grant microphone access when prompted</li>
              <li>Wait briefly while we find you a partner</li>
              <li>Enjoy your conversation with voice and text chat</li>
              <li>Click "Skip" to move to the next person, or "End Call" when done</li>
            </ol>
            
            <h3 className="text-2xl font-medium text-white mt-8">Our Mission</h3>
            <p className="text-lg">
              We believe in the power of human connection. Spark creates a space where people can have genuine, 
              spontaneous conversations without the pressure of social profiles or permanent records. 
              Every conversation is temporary, making each moment authentic and meaningful.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Technology</h3>
            <p className="text-lg">
              Built with modern web technologies including Next.js, React, and WebRTC, Spark provides 
              a fast, secure, and reliable platform for anonymous communication. Our peer-to-peer architecture 
              ensures that your conversations remain private and are never stored on our servers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm mt-8">
        <p>Anonymous voice communication is a science.</p>
        <p className="mt-2">Stay safe. Be respectful. Report abuse.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} Spark. All rights reserved.</p>
      </footer>
    </div>
  );
}
