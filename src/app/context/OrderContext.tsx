import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { CartItem } from './CartContext';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (
    items: CartItem[],
    total: number,
    customerEmail: string,
    customerName: string,
    shippingAddress: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getUserOrders: (email: string) => Order[];
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const col = collection(db, 'orders');
    const unsubscribe = onSnapshot(col, (snap) => {
      const items: Order[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          items: data.items,
          total: data.total,
          status: data.status,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          shippingAddress: data.shippingAddress,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        };
      });
      setOrders(items);
    });
    return unsubscribe;
  }, []);

  const createOrder = async (
    items: CartItem[],
    total: number,
    customerEmail: string,
    customerName: string,
    shippingAddress: string
  ): Promise<Order> => {
    const newOrder: Omit<Order, 'id'> = {
      items,
      total,
      status: 'pending',
      customerEmail,
      customerName,
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const col = collection(db, 'orders');
    const docRef = await addDoc(col, {
      ...newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const order: Order = { id: docRef.id, ...newOrder };
    setOrders((prev) => [order, ...prev]);
    return order;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status, updatedAt: new Date() });
  };

  const getUserOrders = (email: string) => {
    return orders.filter((order) => order.customerEmail === email);
  };

  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        updateOrderStatus,
        getUserOrders,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
