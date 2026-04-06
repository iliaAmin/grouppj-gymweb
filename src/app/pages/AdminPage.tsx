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

export function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin panel</h1>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Products</h3>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Orders</h3>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Pending Orders</h3>
          <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-2xl font-bold">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</p>
        </div>
      </div>

      {message && <p className="mb-4 text-green-600">{message}</p>}
      {csvError && <p className="mb-4 text-red-600">{csvError}</p>}
      <div className="mb-6">
        <label className="font-semibold">Import CSV</label>
        <p className="text-sm text-gray-600 mb-2">CSV format: name,description,price,category,image,rating,stock</p>
        <input
          type="file"
          accept=".csv"
          disabled={csvLoading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseCsv(file);
            e.target.value = '';
          }}
          className="block mt-1"
        />
        {csvLoading && <p className="text-blue-600 mt-2">Importing products...</p>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              step="0.1"
              value={form.rating}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" value={form.category} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="stock">Stock status</Label>
          <Select value={form.stock} onValueChange={(v: string) => setForm(f => ({ ...f, stock: v as 'in' | 'out' }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="image">Image URL</Label>
          <Input id="image" name="image" value={form.image} onChange={handleChange} />
        </div>
        <Button type="submit">{editingId ? 'Update product' : 'Add product'}</Button>
      </form>

      {/* existing products list */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Existing products</h2>
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {filteredProducts.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Stock</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">${p.price}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">
                    {p.stock === 'in' || p.stock === true ? 'In' : 'Out'}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-sm text-blue-600"
                      onClick={() => {
                        setEditingId(p.id as string);
                        setForm({
                          name: p.name || '',
                          description: p.description || '',
                          price: p.price || 0,
                          category: p.category || '',
                          image: p.image || '',
                          rating: p.rating || 0,
                          stock: (p.stock === 'in' || p.stock === true) ? 'in' : 'out',
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm text-green-600"
                      onClick={() => p.id && toggleStock(p.id as string)}
                    >
                      Toggle Stock
                    </button>
                    <button
                      className="text-sm text-red-600"
                      onClick={() => p.id && deleteProduct(p.id as string)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Orders management */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Orders Management</h2>
          <Input
            placeholder="Search orders..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {filteredOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2">{order.id.slice(-8)}</td>
                  <td className="p-2">{order.customerName}</td>
                  <td className="p-2">${order.total.toFixed(2)}</td>
                  <td className="p-2">
                    <Select
                      value={order.status}
                      onValueChange={(value: string) => updateOrderStatus(order.id, value as any)}
                    >
                      <SelectTrigger className="w-32">
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
                  <td className="p-2">{order.createdAt.toLocaleDateString()}</td>
                  <td className="p-2">
                    <button
                      className="text-sm text-blue-600 mr-2"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Order Details - {selectedOrder.id.slice(-8)}</h3>
            <button
              className="text-red-600"
              onClick={() => setSelectedOrder(null)}
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
              <p><strong>Shipping Address:</strong> {selectedOrder.shippingAddress}</p>
            </div>
            <div>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</p>
              <p><strong>Created:</strong> {selectedOrder.createdAt.toLocaleString()}</p>
              <p><strong>Updated:</strong> {selectedOrder.updatedAt.toLocaleString()}</p>
            </div>
          </div>
          <h4 className="font-semibold mb-2">Items:</h4>
          <ul className="list-disc list-inside">
            {selectedOrder.items.map((item: any, index: number) => (
              <li key={index}>
                {item.name} - Quantity: {item.quantity} - Price: ${item.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
