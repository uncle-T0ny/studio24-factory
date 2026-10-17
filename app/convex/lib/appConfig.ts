// The app's name and brand, in one place for the server (emails, backups) and for src, which may
// import it: it is pure. Rename both when you start a new app from the starter.
export const APP_NAME = "Starter App"
export const BRAND = "Your Studio"

// The password-reset sender comes from the deployment's AUTH_EMAIL_FROM, on a domain verified in
// Resend; this placeholder is used until it is set.
export const DEFAULT_EMAIL_FROM = `${APP_NAME} <no-reply@example.com>`

// Written into every project export and checked on import. Choose it once, before the first real
// export: the files people saved carry this exact value.
export const BACKUP_FORMAT = "starter-app/project"
