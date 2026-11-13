import AdminPage from '@/components/AdminPage';
import { groomFirstWedding } from '@/lib/weddingVariants';

export default function ShivamAdminRoute() {
  return <AdminPage wedding={groomFirstWedding} side="groom" />;
}
