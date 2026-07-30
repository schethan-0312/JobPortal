import { Module } from '@nestjs/common';
import { EmployersService } from './employers.service.js';
import { EmployersController } from './employers.controller.js';

@Module({
  providers: [EmployersService],
  controllers: [EmployersController],
  exports: [EmployersService],
})
export class EmployersModule {}
