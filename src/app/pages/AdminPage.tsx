import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // write to inventory collection as requested
      const col = collection(db, 'inventory');
      await addDoc(col, form);
      setMessage('Product added successfully');
      setForm({ name: '', description: '', price: 0, category: '', image: '', rating: 0 });
    } catch (err) {
      console.error(err);
      setMessage('Failed to add product');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin panel</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}
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
        <Button type="submit">Add product</Button>
      </form>
    </div>
  );
}
