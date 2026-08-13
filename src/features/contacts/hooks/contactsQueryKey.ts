// Shared so the add/remove mutations invalidate exactly the list query the
// contacts screen reads, without either side hardcoding the shape.
export const contactsQueryKey = (ownerUid: string | undefined) => ['contacts', ownerUid] as const;
