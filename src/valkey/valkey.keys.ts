export const ValkeyKey = {
  seatLock: (seatId: string) => `seat:lock:${seatId}`,
  invitation: (id: string) => `inv:${id}`,
  pendingContact: (id: string) => `inv:pending:${id}`,
  rsvpRateLimit: (guestId: string) => `rsvp:limit:${guestId}`,
} as const;
