import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.model';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    { id: 1, name: 'Aurora Wireless Headphones', category: 'Audio', price: 129, rating: 4.8, emoji: '🎧', description: 'Wireless over-ear headphones for everyday listening.', stock: 24 },
    { id: 2, name: 'Linen Lounge Chair', category: 'Home', price: 249, rating: 4.8, emoji: '🪑', description: 'A comfortable lounge chair with a linen finish.', stock: 8 },
    { id: 3, name: 'Trailblazer Backpack', category: 'Outdoor', price: 89, rating: 4.8, emoji: '🎒', description: 'A durable backpack for commutes and trails.', stock: 31 },
    { id: 4, name: 'Ceramic Pour-Over Set', category: 'Kitchen', price: 54, rating: 4.8, emoji: '☕', description: 'A ceramic coffee dripper and matching cup.', stock: 16 },
    { id: 5, name: 'Chrono Smartwatch', category: 'Tech', price: 199, rating: 4.8, emoji: '⌚', description: 'A smartwatch for activity tracking and notifications.', stock: 12 },
    { id: 6, name: 'Sunset Sneakers', category: 'Fashion', price: 119, rating: 4.8, emoji: '👟', description: 'Lightweight everyday sneakers.', stock: 19 },
    { id: 7, name: 'Botanica Plant Trio', category: 'Home', price: 39, rating: 4.8, emoji: '🪴', description: 'Three easy-care plants for your home or desk.', stock: 40 },
    { id: 8, name: 'Lumen Desk Lamp', category: 'Home', price: 45, rating: 4.8, emoji: '💡', description: 'An adjustable lamp for focused evening work.', stock: 27 },
  ];

  findAll(category?: string, search?: string): Product[] {
    return this.products.filter((product) =>
      (!category || product.category.toLowerCase() === category.toLowerCase()) &&
      (!search || product.name.toLowerCase().includes(search.toLowerCase())),
    );
  }

  findOne(id: number): Product {
    const product = this.products.find((item) => item.id === id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
