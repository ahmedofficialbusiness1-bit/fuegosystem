# Security Specification - Fuego Pressure Cooker System

## Data Invariants
1. **Customer Integrity**: Every customer must have a `jina`, `idadi`, `bei_bidhaa`, and `kilicholipwa`.
2. **Derived Fields**: `deni` and `hali` must be mathematically consistent with `kilicholipwa` and `bei_bidhaa`.
3. **Temporal Integrity**: `tarehe_kuongezwa` is set once and immutable.
4. **History Consistency**: Every payment record in `historia_malipo` must correspond to an actual shift in the parent customer's `kilicholipwa`.
5. **Admin Access**: Only verified administrators can perform write operations.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a customer with an `admin: true` claim in the payload (Wait, we don't store roles in the customer doc, but in a separate collection).
2. **Resource Poisoning**: `jina.size() > 500` or `maelezo.size() > 5000`.
3. **State Shortcutting**: Updating `deni` to 0 while `kilicholipwa` remains less than `bei_bidhaa`.
4. **Negative Value Attack**: Setting `kilicholipwa` to -50,000.
5. **Immortality Breach**: Attempting to change `tarehe_kuongezwa` after creation.
6. **Orphaned Writes**: Creating a payment history record for a non-existent customer.
7. **Relational Sync Failure**: Updating a customer's `kilicholipwa` without a corresponding `existsAfter` check for a history entry in a batch.
8. **ID Poisoning**: Injecting non-alphanumeric characters into a customer ID.
9. **Email Spoofing**: Setting `aliyehifadhi` in a history record to an email that doesn't match `request.auth.token.email`.
10. **Quantity Logic**: Setting `idadi` to 0 or a negative number.
11. **Excessive Payment**: Setting `kilicholipwa` to more than 200% of `bei_bidhaa` (unlikely but good to bridge).
12. **Unauthorized Deletion**: Attempting to delete a customer record as a standard authenticated user.

## Test Runner Plan
- Verify `create` on `/wateja/` with valid schema.
- Verify `update` on `/wateja/` ensures consistent `deni`.
- Verify `create` on `/wateja/{id}/historia_malipo/` requires parent existence.
