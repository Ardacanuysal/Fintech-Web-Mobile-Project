import React from 'react';
import Watchlist from '../components/Watchlist';

const WatchlistPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Watchlist</h1>
      <Watchlist />
    </div>
  );
};

export default WatchlistPage; 