// checkpoint/services/invitation/src/graphql/entities/invitation.entity.ts
import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
    description:
        'Einladung zu einem Event. Minimalvariante ohne Prisma-Relationen (eventId, guestProfileId sind Strings).',
})
export class InvitationDTO {
    @Field(() => ID, { description: 'ID der Einladung (cuid).' })
    id!: string;

    @Field(() => String, { nullable: true })
    firstName?: string;
    @Field(() => String, { nullable: true })
    lastName?: string;

    @Field(() => ID, { description: 'ID des Events (String, FK im Zielsystem).' })
    eventId!: string;

    @Field(() => ID, {
        nullable: true,
        description: 'ID des Gast-Profils (String, FK im Zielsystem).',
    })
    guestProfileId?: string;

    @Field(() => String, {
        description: 'Aktueller Status der Einladung.',
    })
    status!: string;

    @Field(() => GraphQLISODateTime) createdAt!: Date;
    @Field(() => GraphQLISODateTime) updatedAt!: Date;

    @Field(() => String, {
        nullable: true,
        description: 'RSVP-Antwort (YES/NO), optional.',
    })
    rsvpChoice?: string;

    @Field(() => GraphQLISODateTime, { nullable: true }) rsvpAt?: Date | null;
    @Field(() => Boolean, {
        nullable: true,
        description:
            'Admin-Approval. Wenn das DB-Schema dieses Feld enthält, wird es hier gespiegelt.',
    })
    approved?: boolean;

    @Field(() => ID, {
        nullable: true,
    })
    approvedById?: string;

    @Field(() => GraphQLISODateTime, { nullable: true }) approvedAt?: Date | null;

    @Field(() => Int, {
        description: 'Wie viele zusätzliche Gäste darf dieser Gast einladen (Plus-Ones).',
    })
    maxInvitees!: number;

    @Field({
        nullable: true,
        description:
            'Optional: Referenz auf die Einladung, durch die diese Einladung entstanden ist (Invite-Chain).',
    })
    invitedByInvitationId?: string;

    @Field(() => ID, {
        nullable: true,
    })
    invitedById?: string;

    @Field(() => [String], {
        nullable: true,
        description: 'Liste der IDs der Plus-Ones, die dieser Gast eingeladen hat.',
    })
    plusOnes?: string[];

    @Field(() => String, {
        nullable: true,
    })
    phone?: string;

    @Field(() => String, {
        nullable: true,
    })
    email?: string;
}
