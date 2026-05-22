import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Documentation AI</h1>
        <p className="text-sm text-ink-800/70 mb-8">Sign in to continue</p>
        <LoginForm />
      </div>
    </main>
  );
}
