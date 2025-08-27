import {
  Controller,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from '../../../course/services/subscriptions/subscriptions.service';
import { AuthGuard } from '../../../user/guards/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}
  @Post()
  async subscriptionsToCourse(
    @Request() req,
    @Query('courseId', ParseIntPipe) courseId: number,
  ) {
    const { id } = req.user;
    await this.subscriptionsService.subscribeToACourse(id, courseId);
    return 'Suscripción exitosa';
  }
}
