import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly svc: TrackingService) {}

  @Get()
  list(@Request() req) {
    return this.svc.list(req.user);
  }

  @Post()
  add(@Request() req, @Body() dto: CreateTrackingDto) {
    return this.svc.add(req.user, dto);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.svc.update(req.user, +id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.svc.remove(req.user, +id);
  }
}
