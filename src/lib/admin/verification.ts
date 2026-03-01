// Admin verification utilities
// Server-side admin checking (independent from public contact email)

export function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim();
}

export function isAdminEmail(email: string): boolean {
  const adminEmail = getAdminEmail();
  return adminEmail ? email.toLowerCase() === adminEmail.toLowerCase() : false;
}
