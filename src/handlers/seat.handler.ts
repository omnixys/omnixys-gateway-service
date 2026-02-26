/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { KafkaEnvelope } from '../kafka/decorators/kafka-envelope.type.js';
import {
  KafkaEvent,
  KafkaHandler,
} from '../kafka/decorators/kafka-event.decorator.js';
import { getTopic } from '../kafka/kafka-topic.properties.js';
import { UserSignedUpPayload } from '../subscriptions/models/payloads/user-signup.payload.js';
import { PubSubEngine } from 'graphql-subscriptions';

export type UserSignedUpEvent = KafkaEnvelope<UserSignedUpPayload>;

import {
  KafkaEventContext,
  KafkaEventHandler,
} from '../kafka/interface/kafka-event.interface.js';
import { Inject, Injectable } from '@nestjs/common';

@KafkaHandler('seat')
@Injectable()
export class SeatHandler implements KafkaEventHandler {
  constructor(
    @Inject('PUBSUB')
    private readonly pubsub: PubSubEngine,
  ) {}

  @KafkaEvent(getTopic('broadcastDiff'))
  async handle(
    topic: string,
    data: any,
    _context: KafkaEventContext,
  ): Promise<void> {
    switch (topic) {
      case getTopic('broadcastDiff'):
        await this.send(data);
        break;

      default:
        console.warn(`Unknown user topic: ${topic}`);
    }
  }

  async send(event: UserSignedUpEvent) {
    await this.pubsub.publish('USER_SIGNED_UP', {
      userId: event.payload.userId,
      username: event.payload.username,
      password: event.payload.password,
      invitationId: event.payload.invitationId,
      lastName: event.payload.lastName,
      firstName: event.payload.firstName,
    });
  }
}
