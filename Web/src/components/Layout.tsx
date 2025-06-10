import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Home, 
  BarChart2, 
  Briefcase, 
  User,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';
import AuthModal from './AuthModal';
import { searchStocks } from '../services/finnhub';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // Show auth modal on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited && !currentUser) {
      setShowAuthModal(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, [currentUser]);

  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle mobile menu
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }

      // Handle user menu
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, showUserMenu]);

  // Close menus and clear search on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
    setSearchResults([]);
    setSearchQuery('');
  }, [location]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Auto-focus search input when menu opens
  useEffect(() => {
    if (isMenuOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMenuOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchStocks(searchQuery);
          setSearchResults(results.result.slice(0, 5));
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 2000);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchItemClick = (symbol: string) => {
    setSearchResults([]);
    setSearchQuery('');
    setIsMenuOpen(false);
    navigate(`/stock/${symbol}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/markets', label: 'Markets', icon: <BarChart2 className="w-5 h-5" /> },
    { path: '/portfolio', label: 'Portfolio', icon: <Briefcase className="w-5 h-5" /> },
    { path: '/watchlist', label: 'Watchlist', icon: <BarChart2 className="w-5 h-5" /> },
    { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Desktop Header */}
      <header className="bg-white shadow-sm py-4 px-6 fixed top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Unix Trading Hub" 
                className="h-8"
              />
            </Link>
            
            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 !py-2 text-sm"
                leftIcon={<Search className="w-3.5 h-3.5 text-gray-400" />}
                ref={searchInputRef}
              />
              
              {isSearching && (
                <div className="absolute z-30 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 p-2">
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && !isSearching && (
                <div className="absolute z-30 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200">
                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSearchItemClick(item.symbol)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      <div className="font-medium">{item.symbol}</div>
                      <div className="text-sm text-gray-500 truncate">{item.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  ref={userButtonRef}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-600">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div
                    ref={userMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Login
              </Button>
            )}
          </div>
          
          <button
            ref={buttonRef}
            className="md:hidden text-gray-600 z-50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="fixed inset-0 z-40 bg-white md:hidden"
          style={{ paddingTop: '4rem' }}
        >
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="relative mb-6">
              <Input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                className="!py-2 text-sm"
                leftIcon={<Search className="w-3.5 h-3.5 text-gray-400" />}
                ref={searchInputRef}
                autoFocus
              />
              
              {isSearching && (
                <div className="absolute z-50 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 p-2">
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && !isSearching && (
                <div className="absolute z-50 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200">
                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => handleSearchItemClick(item.symbol)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      <div className="font-medium">{item.symbol}</div>
                      <div className="text-sm text-gray-500 truncate">{item.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="space-y-1 mb-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              ))}
            </nav>
            
            {currentUser ? (
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">
                  {currentUser.displayName || currentUser.email}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  fullWidth
                  className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  fullWidth
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 mt-16 md:ml-64 md:mt-16">
        {children}
      </main>
      
      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:justify-between md:w-64 md:bg-white md:border-r md:pt-20 md:pb-6">
        <nav className="px-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="px-6 mt-auto">
          <p className="text-xs text-gray-500 mb-4">
            © 2025 Unix Trading Hub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Layout;