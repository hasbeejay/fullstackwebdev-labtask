import { Injectable, NotFoundException } from '@nestjs/common';
import { Cart, CartItem } from './cart.model';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  private readonly carts = new Map<number, Cart>();

  constructor(private readonly products: ProductsService) {}

  getCart(userId: number) {
    const cart = this.carts.get(userId) ?? { userId, items: [] };
    const items = cart.items.map((item) => {
      const product = this.products.findOne(item.productId);
      return { ...item, product, lineTotal: product.price * item.quantity };
    });
    return { userId, items, total: items.reduce((sum, item) => sum + item.lineTotal, 0) };
  }

  add(userId: number, item: CartItem) {
    const product = this.products.findOne(item.productId);
    if (item.quantity > product.stock) throw new NotFoundException('Requested quantity is unavailable');
    const cart = this.carts.get(userId) ?? { userId, items: [] };
    const current = cart.items.find((entry) => entry.productId === item.productId);
    if (current) current.quantity += item.quantity;
    else cart.items.push({ ...item });
    this.carts.set(userId, cart);
    return this.getCart(userId);
  }

  remove(userId: number, productId: number) {
    const cart = this.carts.get(userId);
    if (cart) cart.items = cart.items.filter((item) => item.productId !== productId);
    return this.getCart(userId);
  }

  clear(userId: number) {
    this.carts.delete(userId);
    return this.getCart(userId);
  }
}
