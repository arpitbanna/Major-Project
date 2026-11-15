# CoalSafe — Quality Assurance & Testing Checklist

This document outlines manual and functional testing steps for verifying the CoalSafe mine management system before presentations and viva examinations.

---

## 1. Authentication & Authorization Tests

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **Login with Valid Credentials** | Enter registered email & password on `/login`. | Redirects to Dashboard `/`. Name and role chip appear in header and dashboard. | |
| **Login with Invalid Credentials** | Enter incorrect password. | Error banner displayed: "Invalid login credentials". No session created. | |
| **Session Persistence** | Refresh the page while logged in. | User remains logged in without being redirected back to login screen. | |
| **Logout** | Click Logout in user menu or sidebar. | Clears token from storage and redirects to `/login`. Protected routes become inaccessible. | |
| **Role-Protected Route Access** | Log in as `Supervisor` and try to visit `/admin/users`. | Access denied or 403 Forbidden. Restricted actions are hidden in UI. | |

---

## 2. Shift Handover Lifecycle Tests

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **Create Handover (Draft)** | Navigate to `/handover/new`. Fill shift date, shift type, mine section, equipment, and production notes. Click "Save Draft". | Handover saved with status `Draft`. Appears in list and summary card. | |
| **Edit Draft Handover** | Open created draft from list. Click "Edit Draft", modify production summary, and save. | Changes saved successfully. Status remains `Draft`. | |
| **Submit Handover** | Open draft handover and click "Submit Handover". Confirm via modal dialog. | Status transitions to `Submitted`. Notification indicates pending review. | |
| **Cross-Shift 4-Eyes Verification** | Log in as outgoing in-charge and try to acknowledge own handover. | Acknowledge button is hidden or disabled; backend returns 403 (cannot acknowledge own handover). | |
| **Incoming Shift Acknowledgement** | Log in as incoming in-charge (or Mine Manager/Admin). Click "Acknowledge & Sign Off Shift" and confirm in modal dialog. | Status transitions to `Acknowledged`. Acknowledged timestamp and user ID are recorded. | |
| **Immutable Record Locking** | Attempt to edit or modify an `Acknowledged` handover via UI or API. | Database trigger raises exception. Express backend returns 400: "Acknowledged handovers cannot be modified." | |

---

## 3. Dashboard Verification

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **24-Hour Shift Detection** | View the "Active Shift" chip in top-right of Dashboard. | Accurately identifies Shift 1 (06:00–14:00), Shift 2 (14:00–22:00), or Shift 3 (22:00–06:00). | |
| **Summary Counter Accuracy** | Check "Today's Shift Handovers" and "Pending Acknowledgements" cards. | Counter values match exact database counts. Empty/zero state displays cleanly when no rows exist. | |
| **Recent Activity Feed** | Inspect recent shift handover list on Dashboard. | Displays recent items with formatted date, shift type, and status badges. | |

---

## 4. Error Handling & Edge Cases

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **404 Page Route** | Navigate to an unmapped path (e.g., `/unknown-page`). | Displays clean 404 "Page Not Found" screen with button returning to Dashboard. | |
| **Database Disconnected State** | Test app when backend cannot reach Supabase. | Returns 503 with friendly advisory message rather than crashing the Express server. | |
| **Confirmation Modals** | Click Submit or Acknowledge actions on Handover page. | Custom modal overlay appears. Canceling aborts action without state change. | |
