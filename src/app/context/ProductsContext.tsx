import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export interface Product {
  id?: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  description?: string;
  rating?: number;
  stock?: string | boolean;
  [key: string]: any;
}

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  toggleStock: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const setupListener = () => {
    console.log('Setting up products listener...');
    console.log('Firebase db instance:', db);
    setLoading(true);
    setError(null);

    try {
      const col = collection(db, 'inventory');
      console.log('Collection reference:', col);

      const unsubscribe = onSnapshot(
        col,
        (snap) => {
          console.log('Products snapshot received:', snap.docs.length, 'documents');
          console.log('Snapshot metadata:', snap.metadata);
          const items: Product[] = snap.docs.map((d) => {
            console.log('Document data:', d.id, d.data());
            return { id: d.id, ...(d.data() as any) };
          });
          console.log('Parsed products:', items.length, items);
          setProducts(items);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error loading products:', err);
          console.error('Error code:', err.code);
          console.error('Error message:', err.message);

          // Fallback: try to fetch products once if listener fails
          console.log('Attempting fallback fetch...');
          getDocs(col).then((querySnap) => {
            console.log('Fallback fetch successful:', querySnap.docs.length, 'documents');
            const items: Product[] = querySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setProducts(items);
            setLoading(false);
            setError(null);
          }).catch((fallbackErr) => {
            console.error('Fallback fetch also failed:', fallbackErr);
            setError(`Failed to load products: ${err.message} (${err.code})`);
            setLoading(false);
          });
        }
      );

      unsubscribeRef.current = unsubscribe;
      console.log('Listener setup complete');
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up products listener:', err);

      // Try fallback fetch if listener setup fails
      try {
        const col = collection(db, 'inventory');
        getDocs(col).then((querySnap) => {
          console.log('Fallback fetch successful after setup error:', querySnap.docs.length, 'documents');
          const items: Product[] = querySnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          setProducts(items);
          setLoading(false);
          setError(null);
        }).catch((fallbackErr) => {
          console.error('Fallback fetch failed:', fallbackErr);
          setError('Failed to initialize products listener');
          setLoading(false);
        });
      } catch (fallbackErr) {
        console.error('Fallback setup also failed:', fallbackErr);
        setError('Failed to initialize products listener');
        setLoading(false);
      }

      return null;
    }
  };

  useEffect(() => {
    // Small delay to ensure Firebase is fully initialized
    const timer = setTimeout(() => {
      setupListener();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (unsubscribeRef.current) {
        console.log('Cleaning up products listener...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const retry = () => {
    console.log('Manual retry triggered');
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setupListener();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const toggleStock = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const newStock = prod.stock === 'in' || prod.stock === true ? 'out' : 'in';
    await updateProduct(id, { stock: newStock });
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const col = collection(db, 'inventory');
      await addDoc(col, product);
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const docRef = doc(db, 'inventory', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        retry,
        updateProduct,
        toggleStock,
        addProduct,
        deleteProduct,
        getProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
