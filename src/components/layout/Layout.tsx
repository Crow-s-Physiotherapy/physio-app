import { type ReactNode } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import MainContent from '../common/MainContent';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout = ({ children, className = '' }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <MainContent className={className}>{children}</MainContent>
      <Footer />
    </div>
  );
};

export default Layout;
