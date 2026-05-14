import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0a07] via-[#1a1410] to-[#2d1f15]">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-6 border-b border-[#ff6b35]/20">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#ff8a5a] flex items-center justify-center font-bold text-white">SY</div>
          <h1 className="text-3xl font-bold tracking-tight text-white group-hover:text-[#ff6b35] transition-colors" style={{ fontFamily: "'Google Sans', sans-serif" }}>SYNCED</h1>
        </Link>
        <nav className="flex gap-8 text-sm">
          <Link href="/about" className="text-white/70 hover:text-white transition-colors">About</Link>
          <Link href="/rules" className="text-white/70 hover:text-white transition-colors">Rules</Link>
          <Link href="/privacy" className="text-[#ff6b35] font-medium transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-12">
        <div className="bg-[#1a1410]/60 backdrop-blur-md border border-[#ff6b35]/30 rounded-2xl p-8 md:p-12 hover:border-[#ff6b35]/60 transition-colors">
          <h2 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>Privacy Policy</h2>
          <p className="text-sm text-white/50 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8 text-white/90">
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Our Commitment to Privacy</h3>
              <p className="text-lg leading-relaxed">
                SYNCED is built with privacy at its core. We collect minimal data and do not store personal information.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Data We Collect</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Temporary Session IDs:</strong> Generated locally in your browser for matching purposes only</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Connection Data:</strong> Necessary technical data for establishing peer-to-peer connections</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No Audio Recording:</strong> Voice calls are direct peer-to-peer and not recorded or stored</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No Chat Logs:</strong> Text messages are transmitted in real-time and not saved</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>How We Use Your Data</h3>
              <p className="text-lg mb-4">The minimal data we process is used solely to:</p>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Match you with other users</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Establish secure peer-to-peer connections</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Maintain service quality and performance</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Data Retention</h3>
              <p className="text-lg leading-relaxed">
                All session data is temporary and automatically deleted when you disconnect. We do not maintain 
                logs of conversations, user profiles, or browsing history.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Your Rights</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Complete anonymity - no account required</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Right to disconnect at any time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>No tracking across sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Direct peer-to-peer communication</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Safety & Reporting</h3>
              <p className="text-lg mb-4">While we prioritize user privacy, we take safety seriously. If you encounter inappropriate behavior:</p>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Immediately use the &quot;Skip&quot; button to end the conversation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Report serious violations through our contact channels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span>Never share personal information with strangers</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Third-Party Services</h3>
              <p className="text-lg leading-relaxed">
                We use STUN servers (provided by Google) for WebRTC connection establishment. These are industry-standard 
                services that help establish peer-to-peer connections without exposing your actual IP address to other users.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Cookies and Tracking</h3>
              <p className="text-lg leading-relaxed">
                SYNCED does not use cookies for tracking or analytics. The only data stored in your browser is 
                when you close the tab.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Children&apos;s Privacy</h3>
              <p className="text-lg leading-relaxed">
                SYNCED is not intended for use by children under the age of 13. We do not knowingly collect 
                provided information to us, please contact us.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Changes to This Policy</h3>
              <p className="text-lg leading-relaxed">
                We may update this privacy policy occasionally. Changes will be posted on this page with an updated date.
                We encourage you to review this policy periodically for any changes.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Contact</h3>
              <p className="text-lg leading-relaxed">
                Questions about privacy? We&apos;re here to help. Contact us through our official channels.
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
