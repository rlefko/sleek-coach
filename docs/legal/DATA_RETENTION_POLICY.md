# Data Retention Policy

**Effective Date:** December 10, 2024
**Version:** 1.0

## Overview

This Data Retention Policy describes how Sleek Coach retains, archives, and deletes user data. This policy supports our commitment to privacy, compliance with data protection regulations (including GDPR and CCPA), and responsible data management.

---

## Retention Schedule

### Active Accounts

For active user accounts, data is retained as follows:

| Data Category | Retention Period | Purpose |
|--------------|------------------|---------|
| **Account Credentials** | Duration of account | Authentication and account access |
| **User Profile** | Duration of account | Service personalization and TDEE calculations |
| **Fitness Goals** | Duration of account | Goal tracking and progress measurement |
| **Dietary Preferences** | Duration of account | Nutrition recommendations |
| **Check-in Data** | Duration of account | Weight tracking and trend analysis |
| **Nutrition Logs** | Duration of account | Nutrition tracking and adherence |
| **Progress Photos** | Duration of account | Visual progress tracking |
| **AI Coach Conversations** | 90 days (rolling) | Conversation context and continuity |
| **AI Tool Call Logs** | 90 days (rolling) | Service quality and debugging |
| **Consent Records** | Duration of account + 3 years | Legal compliance and audit |
| **Security Audit Logs** | 2 years | Security monitoring and incident response |

### Inactive Accounts

Accounts with no login activity for 24 months may be flagged as inactive. We will:

1. Send notification emails at 18, 21, and 23 months of inactivity
2. Provide option to reactivate the account
3. After 24 months with no response, the account may be scheduled for deletion

---

## Account Deletion

### User-Initiated Deletion

Users can request account deletion at any time through:
- **In-App**: Settings > Account > Delete Account
- **Email**: Send request to privacy@sleekcoach.app

### Deletion Process

1. **Immediate Actions**
   - Account is deactivated and inaccessible
   - User is logged out of all sessions
   - All authentication tokens are invalidated

2. **Grace Period (30 days)**
   - Data is retained but inaccessible
   - User can request account recovery during this period
   - After 30 days, deletion becomes irreversible

3. **Permanent Deletion**
   - User profile and credentials: Permanently deleted
   - Check-in data: Permanently deleted
   - Nutrition logs: Permanently deleted
   - Progress photos: Immediately and permanently deleted from storage
   - AI conversation history: Immediately deleted
   - Consent records: Retained for 3 years (legal requirement)
   - Anonymized analytics: May be retained indefinitely

### Data That May Be Retained

Certain data may be retained after account deletion for legal or legitimate business purposes:

- **Consent Records**: Retained for 3 years to demonstrate compliance
- **Transaction Records**: Retained for 7 years for financial compliance
- **Legal Hold Data**: If subject to legal proceedings
- **Anonymized Data**: Aggregated, non-identifiable data for analytics

---

## Data Categories and Handling

### Personal Identifiable Information (PII)

- **Definition**: Email, IP addresses, device identifiers
- **Handling**: Encrypted at rest and in transit
- **Deletion**: Permanently removed upon account deletion

### Health and Fitness Data

- **Definition**: Weight, nutrition, photos, health metrics
- **Handling**: Encrypted at rest, access-controlled
- **Deletion**: Permanently removed upon account deletion
- **Special Note**: Progress photos are deleted immediately (no grace period)

### AI Interaction Data

- **Definition**: Chat messages, tool calls, recommendations
- **Handling**: Rolling 90-day retention for active accounts
- **Deletion**: Immediate deletion upon account deletion

### Consent Records

- **Definition**: Records of user consents and withdrawals
- **Handling**: Immutable audit log
- **Deletion**: Retained 3 years post-account deletion

---

## GDPR Compliance (Article 17 - Right to Erasure)

Under GDPR, users have the right to erasure ("right to be forgotten"). We comply by:

1. Providing self-service deletion through the app
2. Completing deletion requests within 30 days
3. Notifying third-party processors of deletion requests
4. Maintaining records of deletion requests and actions

### Exceptions to Erasure

We may retain data when required for:

- Compliance with legal obligations
- Establishment, exercise, or defense of legal claims
- Public health purposes
- Archiving in the public interest

---

## CCPA Compliance

Under the California Consumer Privacy Act, California residents have additional rights:

1. **Right to Know**: Access your data via export feature
2. **Right to Delete**: Delete your data via account deletion
3. **Right to Opt-Out**: We do not sell personal information
4. **Right to Non-Discrimination**: No penalty for exercising rights

---

## Data Backup and Recovery

### Backup Procedures

- Database backups: Daily, retained for 30 days
- Encrypted backup storage
- Geographically distributed for disaster recovery

### Backup Deletion

When user data is deleted:

- Active databases: Immediate deletion
- Backups: Data removed as backups age out (within 30 days)

---

## Third-Party Data Processors

We use third-party services that may process user data:

| Provider | Data Processed | Retention Agreement |
|----------|---------------|---------------------|
| AWS | All stored data | Per our instructions |
| OpenAI/Anthropic | Conversation content | No training, no retention beyond processing |

All processors are bound by Data Processing Agreements (DPAs) that require:

- Data processing only per our instructions
- Appropriate security measures
- Data deletion upon request
- Compliance with applicable laws

---

## Data Minimization

We practice data minimization by:

1. **Collecting Only Necessary Data**: We only collect data required for the service
2. **Birth Year vs. Full DOB**: We collect birth year, not full date of birth
3. **Rolling Retention**: AI conversations are automatically purged after 90 days
4. **No Unnecessary Retention**: Data is not retained beyond its useful purpose

---

## Audit and Review

This policy is reviewed and updated:

- Annually, or more frequently if required
- When significant changes occur to data processing
- When legal requirements change

### Audit Trail

We maintain audit logs of:

- Data access by authorized personnel
- Data deletion requests and completion
- Consent grants and withdrawals
- Security events

---

## Data Breach Response

In the event of a data breach affecting user data:

1. **Detection**: Automated monitoring and alerting
2. **Containment**: Immediate action to prevent further exposure
3. **Assessment**: Determine scope and impact
4. **Notification**: Notify affected users within 72 hours (per GDPR)
5. **Remediation**: Address root cause and prevent recurrence

---

## Contact Information

For questions about this Data Retention Policy or to exercise your data rights:

**Email:** privacy@sleekcoach.app

---

## Policy Updates

We may update this policy from time to time. Material changes will be communicated through the app and via email. The "Effective Date" at the top indicates when this policy was last updated.
