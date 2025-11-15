# ✅ Prescription Availability Check & Rejection Feature - COMPLETE

## Overview
Added functionality to the pharmacy dashboard to check prescription item availability and reject/return prescriptions with missing or unavailable items back to the doctor and patient.

## Features Implemented

### 1. Backend - Availability Check
- **Endpoint:** `GET /pharmacy/prescriptions/:id/check-availability`
- **Method:** `checkPrescriptionAvailability()` in `PharmacyEnhancedService`
- **Functionality:**
  - Checks each medication in the prescription against pharmacy inventory
  - Verifies stock levels and expiry dates
  - Returns detailed availability status for each item
  - Identifies missing/unavailable items

### 2. Backend - Prescription Rejection
- **Endpoint:** `POST /pharmacy/prescriptions/:id/reject`
- **Method:** `rejectPrescription()` in `PharmacyEnhancedService`
- **Functionality:**
  - Updates prescription status to `CANCELLED`
  - Removes pharmacy assignment (`pharmacyId` set to null)
  - Adds rejection reason and missing items to `pharmacyNotes`
  - Sends notifications to both doctor and patient
  - Returns prescription to doctor for alternative handling

### 3. Notifications
- **Doctor Notification:**
  - Type: `PRESCRIPTION_READY`
  - Priority: `HIGH`
  - Includes: Patient name, missing items list, rejection reason
  - Metadata: Reason, missing items, returned by pharmacy, timestamp

- **Patient Notification:**
  - Type: `PRESCRIPTION_READY`
  - Priority: `MEDIUM`
  - Message: Informs patient that prescription was returned to doctor
  - Suggests contacting doctor for alternative prescription

### 4. Frontend - UI Components

#### Check Availability Button
- Added to each prescription card in the pharmacy dashboard
- Highlighted with orange border for pending/processing prescriptions
- Shows loading state while checking

#### Availability Modal
- Displays comprehensive availability check results
- Shows:
  - ✅ **Available Items:** Green badges with stock levels
  - ❌ **Missing Items:** Red badges with status (Out of Stock / Not Found)
  - Required dosage information for missing items
- Auto-populates rejection reason if items are missing
- Provides "Reject & Return to Doctor" button when items are unavailable

#### Rejection Confirmation Modal
- Confirms rejection action before proceeding
- Shows missing items summary
- Displays rejection reason
- Sends rejection request to backend

## Files Modified

### Backend
1. **`backend/src/pharmacy/pharmacy-enhanced.service.ts`**
   - Added `checkPrescriptionAvailability()` method
   - Added `rejectPrescription()` method
   - Integrated `NotificationsService` for sending notifications

2. **`backend/src/pharmacy/pharmacy.controller.ts`**
   - Added `GET /pharmacy/prescriptions/:id/check-availability` endpoint
   - Added `POST /pharmacy/prescriptions/:id/reject` endpoint

3. **`backend/src/pharmacy/pharmacy.module.ts`**
   - Added `NotificationsModule` import

### Frontend
1. **`frontend/app/dashboard/pharmacy/page.tsx`**
   - Added state management for availability checking and rejection
   - Added `handleCheckAvailability()` function
   - Added `handleRejectPrescription()` function
   - Added "Check Availability" button to prescription cards
   - Added availability check modal component
   - Added rejection confirmation modal component
   - Fixed prescription ID and patient/doctor field references

## Usage Flow

1. **Pharmacy staff views prescriptions** in the pharmacy dashboard
2. **Clicks "Check Availability"** button on a prescription
3. **System checks inventory** for each medication in the prescription
4. **Results displayed** in modal:
   - If all items available: Green success message
   - If items missing: Red warning with missing items list
5. **If items missing:**
   - Rejection reason auto-populated
   - Staff can edit reason if needed
   - Click "Reject & Return to Doctor"
   - Confirm rejection in confirmation modal
6. **System processes rejection:**
   - Updates prescription status to `CANCELLED`
   - Removes pharmacy assignment
   - Sends notifications to doctor and patient
   - Prescription returned to doctor for alternative handling

## API Endpoints

### Check Availability
```http
GET /pharmacy/prescriptions/:id/check-availability
Authorization: Bearer <token>
```

**Response:**
```json
{
  "prescriptionId": "uuid",
  "allAvailable": false,
  "missingItems": [
    {
      "name": "Medication Name",
      "required": "Dosage",
      "available": 0,
      "status": "out_of_stock"
    }
  ],
  "availableItems": [
    {
      "name": "Medication Name",
      "available": 50,
      "status": "available"
    }
  ]
}
```

### Reject Prescription
```http
POST /pharmacy/prescriptions/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Items not available in stock: Medication A, Medication B",
  "missingItems": ["Medication A", "Medication B"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "pharmacyId": null,
  "pharmacyNotes": "REJECTED: Items not available...",
  "message": "Prescription rejected and returned to doctor. Notifications sent to doctor and patient."
}
```

## Benefits

1. **Efficient Workflow:** Pharmacy staff can quickly identify unavailable items
2. **Clear Communication:** Automatic notifications keep doctor and patient informed
3. **Better Patient Care:** Prescriptions returned promptly for alternative solutions
4. **Inventory Management:** Helps identify stock gaps and reorder needs
5. **Audit Trail:** Rejection reasons and missing items are logged in prescription notes

## Testing Checklist

- [x] Check availability for prescription with all items available
- [x] Check availability for prescription with missing items
- [x] Reject prescription with missing items
- [x] Verify notifications sent to doctor
- [x] Verify notifications sent to patient
- [x] Verify prescription status updated to CANCELLED
- [x] Verify pharmacy assignment removed
- [x] Test UI modals and button interactions
- [x] Test error handling for API failures

## Status: ✅ COMPLETE

All features have been implemented and are ready for use!



