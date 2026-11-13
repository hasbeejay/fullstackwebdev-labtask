import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './order.dto';
import { Order } from './order.model';

@Injectable()
export class OrdersService {
  private readonly orders: Order[] = [];

  constructor(private readonly cart: CartService, private readonly products: ProductsService) {}

  create(userId: number, input: CreateOrderDto): Order {
    const cartItems = input.items?.length ? input.items : this.cart.getCart(userId).items;
    if (!cartItems.length) throw new BadRequestException('Cannot place an order with an empty cart');
    const items = cartItems.map(({ productId, quantity }) => {
      const product = this.products.findOne(productId);
      if (quantity > product.stock) throw new BadRequestException(`${product.name} has insufficient stock`);
      return { productId, quantity, unitPrice: product.price };
    });
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const order: Order = {
      id: Date.now(), userId, customer: input.customer, paymentMethod: input.paymentMethod,
      items, subtotal, tax, total: subtotal + tax, status: 'placed', createdAt: new Date().toISOString(),
    };
    this.orders.push(order);
    this.cart.clear(userId);
    return order;
  }

  findAll(userId: number): Order[] {
    return this.orders.filter((order) => order.userId === userId);
  }

  findOne(userId: number, id: number): Order {
    const order = this.orders.find((entry) => entry.userId === userId && entry.id === id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
