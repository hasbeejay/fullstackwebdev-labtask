import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateOrderDto } from './order.dto';
import { OrdersService } from './orders.service';

@Controller('users/:userId/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Param('userId', ParseIntPipe) userId: number, @Body() body: CreateOrderDto) {
    return this.orders.create(userId, body);
  }

  @Get()
  findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.orders.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('userId', ParseIntPipe) userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findOne(userId, id);
  }
}
