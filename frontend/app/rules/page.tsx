import Link from 'next/link';

export default function Rules() {
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
          <Link href="/rules" className="text-[#ff6b35] font-medium transition-colors">Rules</Link>
          <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-12">
        <div className="bg-[#1a1410]/60 backdrop-blur-md border border-[#ff6b35]/30 rounded-2xl p-8 md:p-12 hover:border-[#ff6b35]/60 transition-colors">
          <h2 className="text-5xl font-bold text-white mb-8" style={{ fontFamily: "'Google Sans', sans-serif" }}>SYNCED Community Rules</h2>
          <div className="space-y-8 text-white/90">
            <p className="text-lg leading-relaxed">
              SYNCED is a platform for respectful academic collaboration. To ensure a safe and positive experience for everyone, please follow these rules:
            </p>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Respect & Safety</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Be respectful</strong> - Treat others with kindness and respect. No harassment, bullying, or hate speech of any kind.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Academic focus only</strong> - Keep conversations focused on learning, studying, and academic collaboration. Any off-topic behavior will result in an immediate ban.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No violence or threats</strong> - Threats of violence, self-harm, or harm to others are strictly prohibited.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Protect your privacy</strong> - Do not share personal information like your full name, address, phone number, or financial details.</span>
                </li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Prohibited Content</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No illegal activities</strong> - Discussion or promotion of illegal activities is not allowed.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No spam or advertising</strong> - Don&apos;t use SYNCED to promote products, services, or other platforms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No impersonation</strong> - Be yourself. Don&apos;t pretend to be someone else.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>No harmful content</strong> - This includes graphic violence, self-harm content, or anything that could cause distress.</span>
                </li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Age Restriction</h3>
              <p className="text-lg leading-relaxed">
                You must be at least 18 years old to use SYNCED. By using this platform, you confirm that you meet this age requirement.
              </p>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Reporting & Moderation</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Report abuse</strong> - If you encounter someone violating these rules, use the &quot;Skip&quot; button to move to the next person and report if needed.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Zero tolerance policy</strong> - Violations of these rules may result in immediate and permanent bans.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Your safety matters</strong> - If you feel unsafe or uncomfortable, end the call immediately.</span>
                </li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "'Google Sans', sans-serif" }}>Best Practices</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Be genuine</strong> - Have authentic conversations and make real connections.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Use interests wisely</strong> - Add relevant interest tags to find like-minded people.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>Give people a chance</strong> - Not every conversation will be perfect, but approach each one with an open mind.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff6b35] font-bold mt-1">•</span>
                  <span><strong>End respectfully</strong> - If you want to end a conversation, do so politely before clicking &quot;Skip&quot;.</span>
                </li>
              </ul>
            </section>

            <div className="mt-8 p-6 bg-[#ff6b35]/10 border border-[#ff6b35]/40 rounded-lg">
              <p className="text-white text-lg">
                <strong>Remember:</strong> Every person you meet on SYNCED is a real human being. Treat them with the same respect and kindness you&apos;d want for yourself.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm py-8 border-t border-[#ff6b35]/10">
        <p>By using SYNCED, you agree to follow these rules.</p>
        <p className="mt-2">Violations will result in immediate action.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} SYNCED. All rights reserved.</p>
      </footer>
    </div>
  );
}
