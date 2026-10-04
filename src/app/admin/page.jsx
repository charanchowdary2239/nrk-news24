import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';

export default function AdminRootPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('nrk_admin_token')?.value;

  if (token && verifyAdminToken(token)) {
    redirect('/admin/dashboard');
  } else {
    redirect('/admin/login');
  }
}
