import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-white px-6 py-3 flex justify-between items-center">
        <span className="font-semibold tracking-tight">Documentation AI</span>
        <span className="text-sm text-ink-800/70">{user.email}</span>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
