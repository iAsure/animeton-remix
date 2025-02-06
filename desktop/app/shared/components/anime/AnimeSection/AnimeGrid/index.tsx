import React from 'react';

const AnimeGrid = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`grid w-full gap-6 relative z-10 ${
        className ||
        'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      }`}
    >
      {children}
    </div>
  );
};

export default AnimeGrid;
