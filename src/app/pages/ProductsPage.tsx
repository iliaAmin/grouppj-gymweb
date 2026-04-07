import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { motion } from 'motion/react';
import { useProducts } from '../context/ProductsContext';

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const { products, loading, error, retry } = useProducts();

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]
    .filter(Boolean) as string[];

  // if you need hash-map style access you can build one from the array:
  // const productsMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      let matchesPrice = true;
      if (priceRange === 'under-30') matchesPrice = product.price < 30;
      else if (priceRange === '30-60') matchesPrice = product.price >= 30 && product.price < 60;
      else if (priceRange === '60-100') matchesPrice = product.price >= 60 && product.price < 100;
      else if (priceRange === 'over-100') matchesPrice = product.price >= 100;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-muted/30">
      {loading && <p className="text-center py-8">Loading products...</p>}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12 px-4">
        <div className="container mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Premium Gym Equipment & Sportswear
          </motion.h1>
          <motion.p
            className="text-xl opacity-90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Everything you need for your fitness journey
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Sort Bar */}
        <motion.div
          className="mb-8 flex flex-col md:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.aside
            className="w-full md:w-64 shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-card rounded-lg p-6 sticky top-24 border">
              <h2 className="text-xl font-bold mb-4">Filters</h2>
              
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategory === category}
                        onCheckedChange={() => setSelectedCategory(category)}
                      />
                      <Label htmlFor={category} className="cursor-pointer capitalize">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-all"
                      checked={priceRange === 'all'}
                      onCheckedChange={() => setPriceRange('all')}
                    />
                    <Label htmlFor="price-all" className="cursor-pointer">
                      All Prices
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-under-30"
                      checked={priceRange === 'under-30'}
                      onCheckedChange={() => setPriceRange('under-30')}
                    />
                    <Label htmlFor="price-under-30" className="cursor-pointer">
                      Under $30
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-30-60"
                      checked={priceRange === '30-60'}
                      onCheckedChange={() => setPriceRange('30-60')}
                    />
                    <Label htmlFor="price-30-60" className="cursor-pointer">
                      $30 - $60
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-60-100"
                      checked={priceRange === '60-100'}
                      onCheckedChange={() => setPriceRange('60-100')}
                    />
                    <Label htmlFor="price-60-100" className="cursor-pointer">
                      $60 - $100
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-over-100"
                      checked={priceRange === 'over-100'}
                      onCheckedChange={() => setPriceRange('over-100')}
                    />
                    <Label htmlFor="price-over-100" className="cursor-pointer">
                      Over $100
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Product Grid */}
          <div className="flex-1">
            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-muted-foreground">
                Showing {filteredAndSortedProducts.length} products
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            {filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
