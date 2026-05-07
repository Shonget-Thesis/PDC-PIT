import Link from 'next/link';

export default function Privacy() {
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
          <h2 className="text-4xl font-light text-white mb-8">Privacy Policy</h2>
          <div className="space-y-6 text-white/80">
            <p className="text-sm text-white/60">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h3 className="text-2xl font-medium text-white mt-8">Our Commitment to Privacy</h3>
            <p className="text-lg">
              Spark is built with privacy at its core. We collect minimal data and do not store personal information.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Data We Collect</h3>
            <ul className="list-disc list-inside space-y-3 text-lg">
              <li><strong>Temporary Session IDs:</strong> Generated locally in your browser for matching purposes only</li>
              <li><strong>Connection Data:</strong> Necessary technical data for establishing peer-to-peer connections</li>
              <li><strong>No Audio Recording:</strong> Voice calls are direct peer-to-peer and not recorded or stored</li>
              <li><strong>No Chat Logs:</strong> Text messages are transmitted in real-time and not saved</li>
            </ul>

            <h3 className="text-2xl font-medium text-white mt-8">How We Use Your Data</h3>
            <p className="text-lg">
              The minimal data we process is used solely to:
            </p>
            <ul className="list-disc list-inside space-y-3 text-lg">
              <li>Match you with other users</li>
              <li>Establish secure peer-to-peer connections</li>
              <li>Maintain service quality and performance</li>
            </ul>

            <h3 className="text-2xl font-medium text-white mt-8">Data Retention</h3>
            <p className="text-lg">
              All session data is temporary and automatically deleted when you disconnect. We do not maintain 
              logs of conversations, user profiles, or browsing history.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Your Rights</h3>
            <ul className="list-disc list-inside space-y-3 text-lg">
              <li>Complete anonymity - no account required</li>
              <li>Right to disconnect at any time</li>
              <li>No tracking across sessions</li>
              <li>Direct peer-to-peer communication</li>
            </ul>

            <h3 className="text-2xl font-medium text-white mt-8">Safety & Reporting</h3>
            <p className="text-lg">
              While we prioritize user privacy, we take safety seriously. If you encounter inappropriate behavior:
            </p>
            <ul className="list-disc list-inside space-y-3 text-lg">
              <li>Immediately use the "Skip" button to end the conversation</li>
              <li>Report serious violations through our contact channels</li>
              <li>Never share personal information with strangers</li>
            </ul>

            <h3 className="text-2xl font-medium text-white mt-8">Third-Party Services</h3>
            <p className="text-lg">
              We use STUN servers (provided by Google) for WebRTC connection establishment. These are industry-standard 
              services that help establish peer-to-peer connections without exposing your actual IP address to other users.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Cookies and Tracking</h3>
            <p className="text-lg">
              Spark does not use cookies for tracking or analytics. The only data stored in your browser is 
              temporary session information needed for the current connection, which is automatically cleared 
              when you close the tab.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Children's Privacy</h3>
            <p className="text-lg">
              Spark is not intended for use by children under the age of 13. We do not knowingly collect 
              personal information from children. If you are a parent or guardian and believe your child has 
              provided information to us, please contact us.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Changes to This Policy</h3>
            <p className="text-lg">
              We may update this privacy policy occasionally. Changes will be posted on this page with an updated date.
              We encourage you to review this policy periodically for any changes.
            </p>

            <h3 className="text-2xl font-medium text-white mt-8">Contact</h3>
            <p className="text-lg">
              Questions about privacy? We're here to help. Contact us through our official channels.
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
