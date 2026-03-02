import { useNavigate } from 'react-router';
import { useOrders, OrderStatus } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { getUserOrders } = useOrders();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl mb-4">Please log in to view your orders</h1>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </motion.div>
      </div>
    );
  }

  const userOrders = getUserOrders(user!.email);

  if (userOrders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl mb-4">No orders yet</h1>
          <p className="text-muted-foreground mb-6">
            Start shopping to create your first order!
          </p>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl mb-8">My Orders</h1>

        <div className="space-y-6">
          {userOrders.map((order, index) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-2">
                          Order #{order.id}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${config.color} text-white`}
                      >
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                              <p className="text-sm font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-1">Shipping Address</p>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress}
                        </p>
                      </div>

                      {/* Order Total */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>

                      {/* Order Status Timeline */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center">
                          {(['pending', 'processing', 'shipped', 'delivered'] as OrderStatus[]).map(
                            (status, idx) => {
                              const currentIndex = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status);
                              const statusIndex = idx;
                              const isActive = statusIndex <= currentIndex;
                              const StatusIcon = statusConfig[status].icon;

                              return (
                                <div key={status} className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    <StatusIcon className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs mt-2 text-center">
                                    {statusConfig[status].label}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
