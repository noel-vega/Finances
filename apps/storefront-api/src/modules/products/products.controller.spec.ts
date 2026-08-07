import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: { findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findOne returns the product when the service finds one', async () => {
    const product = { id: 1, name: 'Shoe' };
    service.findOne.mockResolvedValue(product);

    const result = await controller.findOne('1', 42);

    expect(service.findOne).toHaveBeenCalledWith(1, 42);
    expect(result).toBe(product);
  });

  it('findOne throws NotFoundException when the service finds nothing', async () => {
    service.findOne.mockResolvedValue(undefined);

    await expect(controller.findOne('1', 42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
