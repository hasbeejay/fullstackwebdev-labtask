export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Cart {
  userId: number;
  items: CartItem[];
}
