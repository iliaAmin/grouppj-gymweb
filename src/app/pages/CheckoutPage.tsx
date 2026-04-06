import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ShoppingBag, CreditCard, MapPin, User } from 'lucide-react';
import { motion } from 'motion/react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  const [orderId, setOrderId] = useState<string | null>(null);
  const [rememberShipping, setRememberShipping] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const storedAddress = window.localStorage.getItem('shippingAddress');
    const storedCity = window.localStorage.getItem('shippingCity');
    const storedZip = window.localStorage.getItem('shippingZip');
    const storedRemember = window.localStorage.getItem('rememberShipping') === 'true';

    if (storedRemember) {
      setFormData((current) => ({
        ...current,
        address: storedAddress || '',
        city: storedCity || '',
        zipCode: storedZip || '',
      }));
      setRememberShipping(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!cart.length) {
      setCheckoutError('Your cart is empty. Add items before checking out.');
      return;
    }

    try {
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.zipCode}`;
      const order = await createOrder(
        cart,
        getCartTotal(),
        formData.email,
        formData.name,
        shippingAddress
      );

      if (rememberShipping) {
        window.localStorage.setItem('shippingAddress', formData.address);
        window.localStorage.setItem('shippingCity', formData.city);
        window.localStorage.setItem('shippingZip', formData.zipCode);
        window.localStorage.setItem('rememberShipping', 'true');
      } else {
        window.localStorage.removeItem('shippingAddress');
        window.localStorage.removeItem('shippingCity');
        window.localStorage.removeItem('shippingZip');
        window.localStorage.removeItem('rememberShipping');
      }

      setOrderId(order.id);
      setShowConfirmation(true);
      clearCart();
      window.alert('Your order is confirmed!');

      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (error: any) {
      console.error(error);
      setCheckoutError(error?.message || 'Failed to complete checkout. Please try again.');
    }
  };

  if (cart.length === 0 && !orderId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl mb-4">Your cart is empty</h1>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </motion.div>
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-4">
            Order ID: <strong>{orderId}</strong>
          </p>
          <p className="mb-6">
            Thank you for your purchase! You can track your order in the Orders page.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/orders')}>View Orders</Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const total = getCartTotal();
  const shipping = 10;
  const tax = total * 0.1;
  const grandTotal = total + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl mb-4">Checkout</h1>
        {checkoutError && (
          <div className="mb-6 rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
            {checkoutError}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <input
                      id="rememberShipping"
                      name="rememberShipping"
                      type="checkbox"
                      checked={rememberShipping}
                      onChange={(e) => setRememberShipping(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                    />
                    <label htmlFor="rememberShipping" className="text-sm text-slate-700">
                      Remember shipping details for next time
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info (hidden for now) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Expiry</Label>
                      <Input
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCVV">CVV</Label>
                      <Input
                        id="cardCVV"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full">
                Place Order
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-semibold">$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">${grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
