import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/shell/BottomNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/api/auto-login');

  return (
    <div className="min-h-screen bg-beige-200">
      <div className="mx-auto min-h-screen max-w-xl bg-beige-200 pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
