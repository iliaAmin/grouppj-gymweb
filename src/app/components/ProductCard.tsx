import { Link } from 'react-router';
import { ShoppingCart, Star } from 'lucide-react';
import { Product, useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image || '/placeholder.png'}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="flex-1 p-4">
          {product.rating != null && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating}</span>
            </div>
          )}
          <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{product.category || ''}</p>
          <p className="text-xl font-bold">${product.price}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            className="w-full"
            size="sm"
            disabled={product.stock === 'out' || product.stock === false}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 'out' || product.stock === false ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}