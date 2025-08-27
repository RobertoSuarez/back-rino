import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subscription } from '../../../database/entities/subscription.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
  ) {}

  async subscribeToACourse(userId: number, courseId: number) {
    const sub = await this.subscriptionRepo.findOneBy({
      user: { id: userId },
      course: { id: courseId },
    });

    if (sub) {
      throw new Error('Ya estás suscrito a este curso.');
    }

    const newSub = this.subscriptionRepo.create({
      user: { id: userId },
      course: { id: courseId },
    });

    return this.subscriptionRepo.save(newSub);
  }
}
