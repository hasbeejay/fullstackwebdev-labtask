import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AddCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart/:userId')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@Param('userId', ParseIntPipe) userId: number) {
    return this.cart.getCart(userId);
  }

  @Post('items')
  addItem(@Param('userId', ParseIntPipe) userId: number, @Body() body: AddCartItemDto) {
    return this.cart.add(userId, body);
  }

  @Delete('items/:productId')
  removeItem(@Param('userId', ParseIntPipe) userId: number, @Param('productId', ParseIntPipe) productId: number) {
    return this.cart.remove(userId, productId);
  }

  @Delete()
  clear(@Param('userId', ParseIntPipe) userId: number) {
    return this.cart.clear(userId);
  }
}
