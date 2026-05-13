# Security Specification for CampusRide

## Data Invariants
1. A user cannot have more than 5 active rides (either as driver or passenger).
2. A username must be unique (checked via `usernames` collection).
3. A ride's `availableSeats` must never be negative.
4. A student can only join a ride if `availableSeats > 0`.
5. Only the driver can mark a ride as 'completed' or 'cancelled'.
6. Only the owner of a passenger request can accept/reject joiners.
7. Ratings can only be given after a ride is 'completed'.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Attempt to create a user profile with a UID that doesn't match `auth.uid`.
2. **Username Hijack**: Attempt to register a username that already exists in `/usernames/`.
3. **Seat Overflow**: Attempt to join a ride where `availableSeats == 0`.
4. **Illegal State Transition**: Passenger trying to set ride status to 'completed'.
5. **Rating Fraud**: User rating themselves.
6. **Immutable Field Tamper**: Changing `driverId` on an existing ride.
7. **Negative Price**: Offering a ride with `price: -10`.
8. **Unauthorized Message**: Sending a message to a ride you aren't a participant of.
9. **Spam Ride Creation**: Creating 100 rides in a row (handled by rate limiting/active count rules).
10. **ID Poisoning**: Injecting 1MB string as a `rideId`.
11. **Shadow Field**: Adding `isVerified: true` to a user profile when registering.
12. **Future Date Injection**: Setting `createdAt` to a year in the future instead of `request.time`.

## Test Runner
A `firestore.rules.test.ts` will be implemented to verify these constraints.
