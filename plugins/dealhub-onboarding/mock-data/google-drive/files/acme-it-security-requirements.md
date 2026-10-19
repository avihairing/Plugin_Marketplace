# Acme Industrial: IT and Security Requirements for New SaaS Vendors

*Owner: Acme IT Security · Shared with DealHub 2026-10-09*

1. **SSO:** All user access through Okta (SAML 2.0). No local passwords for employees.
2. **Provisioning:** User lifecycle via Okta SCIM preferred, or a documented manual process.
3. **Security review:** Vendor must complete the Acme security questionnaire and provide a current SOC 2 Type II report **before production access is granted**.
4. **Data residency:** Customer data stored in the US.
5. **Change management:** No production changes during the year-end freeze (December 20 – January 3).
6. **Sandbox first:** All integrations built and tested in a Salesforce full-copy sandbox before production.

**IT contact:** Ben Carter, IT Security Manager (ben.carter@acme-industrial.example)
