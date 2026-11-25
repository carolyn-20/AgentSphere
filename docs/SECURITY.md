# Security notes

- JWT access tokens are short-lived; refresh tokens are rotated and stored as hashes.
- Authorization is checked server-side using tenant membership and role.
- Tool execution uses a server-side allowlist; arbitrary URL fetching is not exposed.
- Secrets are encrypted with AES-256-GCM using `ENCRYPTION_KEY`; rotate keys with a planned re-encryption procedure.
- Model output and retrieved documents are untrusted. They cannot grant permissions or change tool allowlists.
- Uploads are size-limited and accepted by extension allowlist. Add malware scanning and isolated storage before production.
- Use HTTPS, managed secret storage, database backups, rate limiting, CSP, security headers and log redaction in production.
- The included prompt-injection handling is defense-in-depth, not a guarantee against all attacks.
