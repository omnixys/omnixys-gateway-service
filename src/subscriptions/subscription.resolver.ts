// src/subscriptions/subscription.resolver.ts
import { Args, Field, ID, ObjectType, Query, Resolver, Subscription } from '@nestjs/graphql';
import { pubsub, TRIGGER } from './pubsub.js';

@ObjectType()
export class InvitationUpdatedPayload {
    @Field(() => ID) id: string;
    @Field(() => ID) eventId: string;
    @Field(() => ID, { nullable: true }) userId?: string;
    @Field({ nullable: true }) guestProfileId?: string;
    @Field({ nullable: true }) status?: string;
    @Field({ nullable: true }) rsvpChoice?: string;
}

@Resolver()
export class GatewaySubscriptionResolver {
    // nur damit der Schema-Builder einen Query-Root hat
    @Query(() => String, { name: 'wsPing' })
    wsPing(): string {
        return 'ok';
    }

    @Subscription(() => InvitationUpdatedPayload, {
        name: 'invitationUpdated',
        filter: (payload: any, variables: any) => {
            const p = payload?.invitationUpdated ?? payload;
            if (variables?.invitationId) return p?.id === variables.id || p?.id === variables.id;
            if (variables?.eventId) return p?.eventId === variables.eventId;
            if (variables?.userId) return p?.userId === variables.userId;
            return true;
        },
        resolve: (payload: any) => payload?.invitationUpdated ?? payload,
    })
    invitationUpdated(
        @Args('id', { type: () => ID, nullable: true }) _id?: string,
        @Args('eventId', { type: () => ID, nullable: true }) _eventId?: string,
        @Args('userId', { type: () => ID, nullable: true }) _userId?: string,
    ): AsyncIterator<InvitationUpdatedPayload> {
        console.log('ASDASDASDASDA');
        return pubsub.asyncIterator(TRIGGER.INVITATION_UPDATED);
    }
}
