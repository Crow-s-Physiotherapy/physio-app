import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

const MainContent: React.FC<MainContentProps> = ({
  children,
  className = '',
}) => {
  return (
    <main
      id="main-content"
      className={`flex-1 ${className}`}
      role="main"
      tabIndex={-1}
    >
      {children}
    </main>
  );
};

export default MainContent;
