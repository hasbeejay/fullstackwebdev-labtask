export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  customer: { name: string; email: string; address: string; city: string; zip: string };
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'placed';
  createdAt: string;
}
