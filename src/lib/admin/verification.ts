// Admin verification utilities
// Server-side admin checking

export function isAdminEmail(email: string): boolean {
  // Server-side check - NOT exposed to client
  const adminEmail = process.env.ADMIN_EMAIL;
  return adminEmail ? email.toLowerCase() === adminEmail.toLowerCase() : false;
}

export function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL;
}

// For future multi-admin support
export function getAllAdminEmails(): string[] {
  const primaryAdmin = process.env.ADMIN_EMAIL;
  const additionalAdmins = process.env.ADDITIONAL_ADMIN_EMAILS?.split(',') || [];

  return primaryAdmin ? [primaryAdmin, ...additionalAdmins] : additionalAdmins;
}
