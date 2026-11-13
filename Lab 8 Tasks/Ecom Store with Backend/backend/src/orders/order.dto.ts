import { IsEmail, IsIn, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderCustomerDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() address!: string;
  @IsString() city!: string;
  @IsString() zip!: string;
}

export class OrderItemDto {
  @IsInt() @Min(1) productId!: number;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateOrderDto {
  @ValidateNested() @Type(() => OrderCustomerDto) customer!: OrderCustomerDto;
  @IsIn(['card', 'cash-on-delivery']) paymentMethod!: string;
  @ValidateNested({ each: true }) @Type(() => OrderItemDto) items?: OrderItemDto[];
}
