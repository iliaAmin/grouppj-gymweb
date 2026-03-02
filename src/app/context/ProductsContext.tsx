import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  toggleStock: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const col = collection(db, 'inventory');
    const unsubscribe = onSnapshot(col, (snap) => {
      const items: Product[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setProducts(items);
    });

    return unsubscribe;
  }, []);

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, updates);
  };

  const toggleStock = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    const newStock = prod.stock === 'in' || prod.stock === true ? 'out' : 'in';
    await updateProduct(id, { stock: newStock });
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const col = collection(db, 'inventory');
    await addDoc(col, product);
  };

  const deleteProduct = async (id: string) => {
    const docRef = doc(db, 'inventory', id);
    await deleteDoc(docRef);
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
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
