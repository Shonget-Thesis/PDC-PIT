import Link from 'next/link';

export default function Rules() {
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-8 py-8">
        <div className="bg-[#2d3a2d]/50 backdrop-blur-sm border border-[#4a5d4a] rounded-2xl p-8 md:p-12">
          <h2 className="text-4xl font-light text-white mb-8">Community Rules</h2>
          <div className="space-y-6 text-white/80">
            <p className="text-lg">
              Spark is a platform for respectful and meaningful conversations. To ensure a safe and positive experience for everyone, please follow these rules:
            </p>
            
            <h3 className="text-2xl font-medium text-white mt-8">Respect & Safety</h3>
            <ul className="list-disc list-inside space-y-3 text-lg pl-4">
              <li><strong className="text-white">Be respectful</strong> - Treat others with kindness and respect. No harassment, bullying, or hate speech of any kind.</li>
              <li><strong className="text-white">No nudity or sexual content</strong> - This platform is for voice conversation only. Any inappropriate behavior will result in an immediate ban.</li>
              <li><strong className="text-white">No violence or threats</strong> - Threats of violence, self-harm, or harm to others are strictly prohibited.</li>
              <li><strong className="text-white">Protect your privacy</strong> - Do not share personal information like your full name, address, phone number, or financial details.</li>
            </ul>
            
            <h3 className="text-2xl font-medium text-white mt-8">Prohibited Content</h3>
            <ul className="list-disc list-inside space-y-3 text-lg pl-4">
              <li><strong className="text-white">No illegal activities</strong> - Discussion or promotion of illegal activities is not allowed.</li>
              <li><strong className="text-white">No spam or advertising</strong> - Don't use Spark to promote products, services, or other platforms.</li>
              <li><strong className="text-white">No impersonation</strong> - Be yourself. Don't pretend to be someone else.</li>
              <li><strong className="text-white">No harmful content</strong> - This includes graphic violence, self-harm content, or anything that could cause distress.</li>
            </ul>
            
            <h3 className="text-2xl font-medium text-white mt-8">Age Restriction</h3>
            <p className="text-lg">
              You must be at least 18 years old to use Spark. By using this platform, you confirm that you meet this age requirement.
            </p>
            
            <h3 className="text-2xl font-medium text-white mt-8">Reporting & Moderation</h3>
            <ul className="list-disc list-inside space-y-3 text-lg pl-4">
              <li><strong className="text-white">Report abuse</strong> - If you encounter someone violating these rules, use the "Skip" button to move to the next person and report if needed.</li>
              <li><strong className="text-white">Zero tolerance policy</strong> - Violations of these rules may result in immediate and permanent bans.</li>
              <li><strong className="text-white">Your safety matters</strong> - If you feel unsafe or uncomfortable, end the call immediately.</li>
            </ul>
            
            <h3 className="text-2xl font-medium text-white mt-8">Best Practices</h3>
            <ul className="list-disc list-inside space-y-3 text-lg pl-4">
              <li><strong className="text-white">Be genuine</strong> - Have authentic conversations and make real connections.</li>
              <li><strong className="text-white">Use interests wisely</strong> - Add relevant interest tags to find like-minded people.</li>
              <li><strong className="text-white">Give people a chance</strong> - Not every conversation will be perfect, but approach each one with an open mind.</li>
              <li><strong className="text-white">End respectfully</strong> - If you want to end a conversation, do so politely before clicking "Skip".</li>
            </ul>

            <div className="mt-8 p-6 bg-[#6b8e6b]/20 border border-[#6b8e6b] rounded-lg">
              <p className="text-white text-lg">
                <strong>Remember:</strong> Every person you meet on Spark is a real human being. Treat them with the same respect and kindness you'd want for yourself.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-white/40 text-sm mt-8 pb-8">
        <p>By using Spark, you agree to follow these rules.</p>
        <p className="mt-2">Violations will result in immediate action.</p>
        <p className="mt-4 text-xs">© {new Date().getFullYear()} Spark. All rights reserved.</p>
      </footer>
    </div>
  );
}
