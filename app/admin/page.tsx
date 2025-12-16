import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'

export default async function AdminPage() {
  const admin = await isAdmin()
  
  if (!admin) {
    redirect('/admin/login')
  }
  
  redirect('/admin/dashboard')
}
