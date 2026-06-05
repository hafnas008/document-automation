import { redirect } from 'next/navigation';

// Easy-access mode: login form removed. Anyone hitting /login is auto-signed-in.
export default function LoginPage() {
  redirect('/api/auto-login');
}
