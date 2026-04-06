import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useOrders } from '../context/OrderContext';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

interface NewProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  rating?: number;
  stock?: 'in' | 'out';
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers';

export function AdminPage() {
  const { user, isAdmin, users, setAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [form, setForm] = useState<NewProduct>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    rating: 0,
    stock: 'in',
  });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    if (!user || !isAdmin) {
      // redirect non-admins back to home
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'price' || name === 'rating' ? Number(value) : value }));
  };

  const { products, addProduct, updateProduct, deleteProduct, toggleStock } = useProducts();
  const { orders, updateOrderStatus } = useOrders();

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customerEmail?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.id.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredCustomers = users.filter((u) =>
    u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const dashboardCounts = {
    totalProducts: products.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalCustomers: users.length,
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, form as any);
        setMessage('Product updated');
      } else {
        await addProduct(form as any);
        setMessage('Product added successfully');
      }
      setForm({ name: '', description: '', price: 0, category: '', image: '', rating: 0 });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save product');
    }
  };

  const parseCsv = async (file: File) => {
    setCsvError('');
    setCsvLoading(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error('CSV must contain header and at least one row');
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const required = ['name','description','price','category'];
      required.forEach(r => {
        if (!headers.includes(r)) throw new Error(`Missing column: ${r}`);
      });
      const rowProducts: NewProduct[] = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h,i) => {
          obj[h] = values[i]?.trim();
        });
        return {
          name: obj.name || '',
          description: obj.description || '',
          price: Number(obj.price) || 0,
          category: obj.category || '',
          image: obj.image || '',
          rating: Number(obj.rating) || 0,
          stock: obj.stock === 'out' ? 'out' : 'in',
        };
      });

      // upload sequentially
      for (const prod of rowProducts) {
        await addProduct(prod as any);
      }
      setMessage(`${rowProducts.length} products imported`);
    } catch (err: any) {
      console.error(err);
      setCsvError(err.message || 'Failed to parse CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 sm:px-6 lg:flex-row">
        <aside className="w-full max-w-[260px] rounded-[32px] border border-border bg-card p-6 shadow-lg">
          <div className="mb-8">
            <h1 className="text-xl font-semibold mb-2">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage products, customers, and orders in one place.</p>
          </div>
          <nav className="space-y-3">
            {(['dashboard', 'products', 'orders', 'customers'] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                className={`w-full rounded-3xl px-4 py-4 text-left text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-foreground hover:bg-accent/10'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'dashboard'
                  ? 'Dashboard'
                  : tab === 'products'
                  ? 'Products'
                  : tab === 'orders'
                  ? 'Orders'
                  : 'Customers'}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="mb-6 rounded-[32px] bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Admin panel</p>
                <h1 className="mt-2 text-3xl font-semibold text-foreground">Gym shop dashboard</h1>
                <p className="mt-2 text-sm text-muted-foreground">Manage orders, customers, and inventory with clarity.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-muted px-3 py-2 text-foreground">Role: {isAdmin ? 'Admin' : 'User'}</span>
                <span className="rounded-full bg-muted px-3 py-2 text-foreground">Customers: {dashboardCounts.totalCustomers}</span>
              </div>
            </div>
          </div>

          {message && <p className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-700">{message}</p>}
          {csvError && <p className="mb-4 rounded-xl bg-rose-100 px-4 py-3 text-rose-700">{csvError}</p>}

          {activeTab === 'dashboard' && (
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <div className="rounded-3xl bg-card p-5 shadow-sm">
                <p className="text-sm uppercase text-muted-foreground">Total products</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{dashboardCounts.totalProducts}</p>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-sm">
                <p className="text-sm uppercase text-muted-foreground">Total orders</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{dashboardCounts.totalOrders}</p>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-sm">
                <p className="text-sm uppercase text-muted-foreground">Pending orders</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{dashboardCounts.pendingOrders}</p>
              </div>
              <div className="rounded-3xl bg-card p-5 shadow-sm">
                <p className="text-sm uppercase text-muted-foreground">Total revenue</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">${dashboardCounts.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <section className="space-y-6">
              <div className="rounded-3xl bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Products management</h2>
                <div className="mb-6">
                  <label className="font-semibold">Import CSV</label>
                  <p className="text-sm text-muted-foreground mb-2">CSV format: name,description,price,category,image,rating,stock</p>
                  <input
                    type="file"
                    accept=".csv"
                    disabled={csvLoading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) parseCsv(file);
                      e.target.value = '';
                    }}
                    className="block w-full rounded-2xl border border-border bg-background px-3 py-3"
                  />
                  {csvLoading && <p className="mt-2 text-sm text-muted-foreground">Importing products...</p>}
                </div>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} required />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" value={form.description} onChange={handleChange} required />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" value={form.category} onChange={handleChange} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="rating">Rating</Label>
                    <Input id="rating" name="rating" type="number" step="0.1" value={form.rating} onChange={handleChange} />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="stock">Stock</Label>
                    <Select value={form.stock} onValueChange={(v: string) => setForm((f) => ({ ...f, stock: v as 'in' | 'out' }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">In stock</SelectItem>
                        <SelectItem value="out">Out of stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input id="image" name="image" value={form.image} onChange={handleChange} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit">{editingId ? 'Update product' : 'Add product'}</Button>
                  </div>
                </form>
              </div>

              <div className="rounded-3xl bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold">Existing products</h2>
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {filteredProducts.length === 0 ? (
                  <p className="mt-4 text-muted-foreground">No products found.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Price</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-left">Stock</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">{p.name}</td>
                            <td className="px-4 py-3">${p.price}</td>
                            <td className="px-4 py-3">{p.category}</td>
                            <td className="px-4 py-3">{p.stock === 'in' || p.stock === true ? 'In stock' : 'Out of stock'}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => {
                                  setEditingId(p.id as string);
                                  setForm({
                                    name: p.name || '',
                                    description: p.description || '',
                                    price: p.price || 0,
                                    category: p.category || '',
                                    image: p.image || '',
                                    rating: p.rating || 0,
                                    stock: p.stock === 'out' ? 'out' : 'in',
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button className="text-emerald-600 hover:underline" onClick={() => p.id && toggleStock(p.id as string)}>
                                Toggle Stock
                              </button>
                              <button className="text-rose-600 hover:underline" onClick={() => p.id && deleteProduct(p.id as string)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="space-y-6">
              <div className="rounded-3xl bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold">Orders management</h2>
                  <Input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {filteredOrders.length === 0 ? (
                  <p className="mt-4 text-muted-foreground">No orders found.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Order</th>
                          <th className="px-4 py-3 text-left">Customer</th>
                          <th className="px-4 py-3 text-left">Total</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3">{order.id.slice(-8)}</td>
                            <td className="px-4 py-3">{order.customerName}</td>
                            <td className="px-4 py-3">${order.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <Select
                                value={order.status}
                                onValueChange={(value: string) => updateOrderStatus(order.id, value as any)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">{order.createdAt.toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-blue-600 hover:underline" onClick={() => setSelectedOrder(order)}>
                                View details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {selectedOrder && (
                <div className="rounded-3xl bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Order {selectedOrder.id.slice(-8)}</h3>
                      <p className="text-muted-foreground">Customer: {selectedOrder.customerName}</p>
                    </div>
                    <button className="text-rose-600 hover:underline" onClick={() => setSelectedOrder(null)}>
                      Close
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p><span className="font-semibold">Email:</span> {selectedOrder.customerEmail}</p>
                      <p><span className="font-semibold">Shipping address:</span> {selectedOrder.shippingAddress}</p>
                      <p><span className="font-semibold">Status:</span> {selectedOrder.status}</p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Total:</span> ${selectedOrder.total.toFixed(2)}</p>
                      <p><span className="font-semibold">Created:</span> {selectedOrder.createdAt.toLocaleString()}</p>
                      <p><span className="font-semibold">Updated:</span> {selectedOrder.updatedAt.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-2">Items</h4>
                    <ul className="space-y-2">
                      {selectedOrder.items.map((item: any, index: number) => (
                        <li key={index} className="rounded-2xl border border-border p-4">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity} · Price: ${item.price}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'customers' && (
            <section className="space-y-6">
              <div className="rounded-3xl bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Customers</h2>
                    <p className="text-muted-foreground">View users, assign admin privileges, and inspect customer accounts.</p>
                  </div>
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {filteredCustomers.length === 0 ? (
                  <p className="mt-4 text-muted-foreground">No customers found.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">Role</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.uid}>
                            <td className="px-4 py-3">{customer.name}</td>
                            <td className="px-4 py-3">{customer.email}</td>
                            <td className="px-4 py-3">{customer.isAdmin ? 'Admin' : 'Customer'}</td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => setAdmin(customer.uid, !customer.isAdmin)}
                              >
                                {customer.isAdmin ? 'Revoke admin' : 'Make admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
