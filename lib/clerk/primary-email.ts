type EmailAddressLike = {
  id: string;
  emailAddress: string;
};

/** Primary sign-in email from a Clerk User (SDK shape). */
export function getPrimaryEmailFromClerkUser(user: {
  emailAddresses: EmailAddressLike[];
  primaryEmailAddressId: string | null;
}): string | null {
  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];
  const value = primary?.emailAddress?.trim();
  return value || null;
}
