import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { AddMessageDto } from './dto/add-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('support/tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.supportService.create(user.userId, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.supportService.listMine(user.userId);
  }

  @Get(':id')
  getMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.supportService.getMine(user.userId, id);
  }

  @Post(':id/messages')
  addMessage(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AddMessageDto) {
    return this.supportService.addMessage(user.userId, id, dto);
  }
}
