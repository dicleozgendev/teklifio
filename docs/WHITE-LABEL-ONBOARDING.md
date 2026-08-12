# White-Label Customer Onboarding

For authorized operators and evaluators only.

1. Create or authorize the customer workspace through the controlled registration process.
2. In **Settings → Company information**, enter the legal company name, contact details, tax details and address.
3. Upload a PNG/JPG/WebP logo under 400 KB and select a primary brand color.
4. Verify the logo, brand color and company information in the application and a newly generated PDF.
5. Configure quote prefix, validity, currency, notes, VAT rates and PDF footer.
6. Import customers/products with CSV only after reviewing the preview. Duplicate and invalid rows are skipped; organization IDs from CSV are ignored.
7. Invite team members with the least-privileged role and verify the intended email.
8. Run a customer-specific acceptance test in staging before production use.

Custom domains and separate deployments are intentionally out of scope. Branding settings are stored per organization and protected by existing Firestore organization isolation.
