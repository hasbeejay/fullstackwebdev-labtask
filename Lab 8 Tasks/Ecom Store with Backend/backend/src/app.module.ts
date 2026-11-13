import { Module } from '@nestjs/common';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  controllers: [ProductsController, CartController, OrdersController, AuthController],
  providers: [ProductsService, CartService, OrdersService, AuthService],
})
export class AppModule {}
