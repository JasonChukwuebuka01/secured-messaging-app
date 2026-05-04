export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="bg-vault-card p-8 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-bold text-brand mb-4">WhisperBox Initialized</h1>
        <div className="flex items-center gap-2 text-security-ok font-mono text-sm">
          <span className="w-2 h-2 rounded-full bg-security-ok animate-pulse" />
          SYSTEM_SECURE: E2EE_READY
        </div>
      </div>
    </main>
  );
}