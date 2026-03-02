import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeProvider';
import { ProductsProvider } from './context/ProductsContext';
import { OrderProvider } from './context/OrderContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProductsProvider>
          <OrderProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </OrderProvider>
        </ProductsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}