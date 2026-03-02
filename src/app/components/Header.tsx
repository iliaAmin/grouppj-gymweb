import { ShoppingCart, Dumbbell, Moon, Sun, User } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';


export function Header() {
  const { getCartItemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const itemCount = getCartItemCount();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="w-8 h-8" />
          <span className="text-2xl font-bold">GymShop</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link to="/products" className="hidden sm:block hover:text-muted-foreground transition-colors">
            Products
          </Link>
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Profile */}
          {isAuthenticated ? (
            // custom dropdown
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg z-50">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="border-t" />
                  <ul className="flex flex-col">
                    <li>
                      <Link
                        to="/cart"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Cart
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                    </li>
                    {user?.isAdmin && (
                      <li>
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm hover:bg-accent"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      </li>
                    )}
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                          navigate('/');
                        }}
                      >
                        Log out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}