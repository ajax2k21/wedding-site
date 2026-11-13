import AdminPage from '@/components/AdminPage';
import wedding from '@/wedding.config';

export default function AdminRoute() {
  return <AdminPage wedding={wedding} side="bride" />;
}
