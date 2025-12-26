/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { UserSignedUpPayload } from './models/payloads/user-signup.payload.js';
import { Inject } from '@nestjs/common';
import { Query, Resolver, Subscription } from '@nestjs/graphql';

@Resolver()
export class UserSignupSubscriptionResolver {
  constructor(@Inject('PUBSUB') private readonly pubsub: any) {}

  @Query(() => String, { name: 'wsPing' })
  wsPing(): string {
    return 'ok';
  }

  @Subscription(() => UserSignedUpPayload, {
    name: 'userSignedUp',
    resolve: (payload) => payload,
  })
  userSignedUp() {
    return this.pubsub.asyncIterator('USER_SIGNED_UP');
  }

  //   @Subscription(() => LayoutChangePayload, {
  //     filter: (payload, variables) => payload.eventId === variables.eventId,
  //   })
  //   layoutUpdated(@Args('eventId') eventId: string) {
  //     return pubsub.asyncIterator('LAYOUT_UPDATED');
  //   }
  // }

  // @ObjectType()
  // export class LayoutChangePayload {
  //   @Field()
  //   eventId!: string;

  //   @Field()
  //   diff!: any;
}
