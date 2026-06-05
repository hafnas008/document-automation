import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/shell/BottomNav';
import { PageFlow } from '@/components/shell/PageFlow';
import { PageEnter } from '@/components/shell/PageEnter';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supa = supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/api/auto-login');

  return (
    <div className="relative min-h-screen">
      <PageEnter />
      <PageFlow />
      <div className="relative z-[2] mx-auto min-h-screen max-w-xl pb-28">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
