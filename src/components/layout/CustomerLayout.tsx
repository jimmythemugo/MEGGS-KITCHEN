import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Breadcrumbs, CrumbItem } from '@/components/Breadcrumbs';

interface CustomerLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: CrumbItem[];
}

export function CustomerLayout({ children, showBreadcrumbs = true, breadcrumbItems }: CustomerLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 lg:pt-[7.25rem]">
        {showBreadcrumbs && <Breadcrumbs items={breadcrumbItems} />}
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
