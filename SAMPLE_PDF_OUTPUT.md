# 📄 Sample PDF Receipt Output

## Visual Preview of Generated Receipt

Below is a representation of what the generated PDF receipt looks like when downloaded.

---

## PDF Document Layout

### Page Size
- **Format**: A4 (210mm x 297mm)
- **Orientation**: Portrait
- **Margins**: 20mm left/right

---

## Header Section (Blue Background)

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                      VISION CLINIC                           ║
║                 Smart Eye Care Solutions                     ║
║                                                              ║
║          123 Medical Plaza, Healthcare District              ║
║    Phone: (555) 123-4567 | Email: info@visionclinic.com    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Colors:**
- Background: Blue RGB(59, 130, 246)
- Text: White RGB(255, 255, 255)
- Font: Helvetica Bold 24pt (title), 10pt (subtitle), 8pt (contact)

---

## Receipt Title

```
                     PAYMENT RECEIPT
```

**Styling:**
- Font: Helvetica Bold
- Size: 20pt
- Color: Dark Gray RGB(31, 41, 55)
- Alignment: Center

---

## Customer Information Section

```
Customer Information:
─────────────────────
Name: John Doe
Transaction ID: TXN-APT-12345678
Invoice ID: INVOICE01
Date: November 17, 2025
Time: 02:30 PM
```

**Styling:**
- Section Header: Bold 10pt
- Content: Regular 10pt
- Spacing: 5-7mm between lines

---

## Invoice Details Section

```
Invoice Details:
────────────────
Type: Appointment
Description: Consultation with Dr. Smith
```

**Styling:**
- Section Header: Bold 10pt
- Content: Regular 10pt

---

## Itemized Billing Table

```
┌─────────────────────────┬──────────┬────────────┬────────────┐
│ Item                    │ Quantity │ Unit Price │   Total    │
├─────────────────────────┼──────────┼────────────┼────────────┤
│ Consultation            │    1     │  $100.00   │  $100.00   │
│ Retinal Imaging         │    1     │   $50.00   │   $50.00   │
│ Prescription Glasses    │    1     │  $150.00   │  $150.00   │
└─────────────────────────┴──────────┴────────────┴────────────┘
```

**Styling:**
- Theme: Striped (alternating row colors)
- Header Background: Blue RGB(59, 130, 246)
- Header Text: White, Bold
- Body Text: Dark Gray RGB(31, 41, 55)
- Alternate Row: Light Gray RGB(249, 250, 251)
- Cell Padding: 3mm
- Border: 0.1mm Light Gray

---

## Total Amount Section

```
─────────────────────────────────────────────────────────────

                              Total Amount:    $300.00
```

**Styling:**
- "Total Amount" Label: Bold 14pt
- Amount: Bold 16pt, Green RGB(16, 185, 129)
- Top Border: Blue line

---

## Paid Stamp

```
                                    ┌──────────┐
                                    │   PAID   │
                                    └──────────┘
```

**Styling:**
- Background: Green RGB(16, 185, 129)
- Text: White, Bold 14pt
- Shape: Rounded rectangle (3mm radius)
- Size: 50mm x 15mm

---

## Footer Section

```
─────────────────────────────────────────────────────────────

            Thank you for your payment!
     This is an official receipt for your records.
   For inquiries, please contact us at info@visionclinic.com

          Generated on: November 17, 2025 at 2:30:45 PM
```

**Styling:**
- Font: Regular 8pt
- Color: Dark Gray
- Alignment: Center
- Top Border: Thin line
- Position: 30mm from bottom

---

## Complete Visual Example

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃████████████████████████████████████████████████████████████┃
┃███                                                      ████┃
┃███               VISION CLINIC                         ████┃
┃███          Smart Eye Care Solutions                  ████┃
┃███                                                      ████┃
┃███     123 Medical Plaza, Healthcare District         ████┃
┃███  Phone: (555) 123-4567 | Email: info@vision...    ████┃
┃███                                                      ████┃
┃████████████████████████████████████████████████████████████┃
┃                                                            ┃
┃                   PAYMENT RECEIPT                          ┃
┃                                                            ┃
┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
┃                                                            ┃
┃  Customer Information:                                     ┃
┃  ─────────────────────                                     ┃
┃  Name: John Doe                                           ┃
┃  Transaction ID: TXN-APT-12345678                         ┃
┃  Invoice ID: INVOICE01                                     ┃
┃  Date: November 17, 2025                                  ┃
┃  Time: 02:30 PM                                           ┃
┃                                                            ┃
┃  Invoice Details:                                          ┃
┃  ────────────────                                          ┃
┃  Type: Appointment                                         ┃
┃  Description: Consultation with Dr. Smith                  ┃
┃                                                            ┃
┃  ┏━━━━━━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━┳━━━━━━━━━━━┓   ┃
┃  ┃ Item          ┃ Quantity┃ Unit Price┃   Total   ┃   ┃
┃  ┣━━━━━━━━━━━━━━━╋━━━━━━━━━╋━━━━━━━━━━━╋━━━━━━━━━━━┫   ┃
┃  ┃ Consultation  ┃    1    ┃  $100.00  ┃  $100.00  ┃   ┃
┃  ┃ Retinal Scan  ┃    1    ┃   $50.00  ┃   $50.00  ┃   ┃
┃  ┃ Glasses       ┃    1    ┃  $150.00  ┃  $150.00  ┃   ┃
┃  ┗━━━━━━━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━━━┻━━━━━━━━━━━┛   ┃
┃                                                            ┃
┃  ──────────────────────────────────────────────────────   ┃
┃                                                            ┃
┃                       Total Amount:    $300.00            ┃
┃                                                            ┃
┃                                   ╔════════════╗          ┃
┃                                   ║    PAID    ║          ┃
┃                                   ╚════════════╝          ┃
┃                                                            ┃
┃  ──────────────────────────────────────────────────────   ┃
┃                                                            ┃
┃              Thank you for your payment!                   ┃
┃       This is an official receipt for your records.        ┃
┃    For inquiries, please contact us at info@vision...     ┃
┃                                                            ┃
┃        Generated on: November 17, 2025 at 2:30:45 PM      ┃
┃                                                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Legend:
████ = Blue header background
╔══╗ = Green "PAID" stamp
```

---

## File Information

**Filename Format**: `receipt-TXN12345.pdf`

Example filenames:
- `receipt-TXN-APT-1.pdf`
- `receipt-TXN-RX-8.pdf`
- `receipt-INVOICE.pdf`

**File Size**: Typically 20-50 KB

**Pages**: Single page (fits all content on one A4 page)

---

## Color Scheme

### Primary Colors
```
Primary Blue:    RGB(59, 130, 246)   | HEX #3B82F6
Secondary Green: RGB(16, 185, 129)   | HEX #10B981
Dark Gray:       RGB(31, 41, 55)     | HEX #1F2937
Light Gray:      RGB(249, 250, 251)  | HEX #F9FAFB
White:           RGB(255, 255, 255)  | HEX #FFFFFF
```

### Usage
- **Blue**: Header background, table header, divider lines
- **Green**: Total amount, PAID stamp
- **Dark Gray**: Body text
- **Light Gray**: Alternate table rows
- **White**: Header text, stamp text

---

## Typography

### Fonts Used
- **Helvetica Bold**: Headers, titles, amounts
- **Helvetica Regular**: Body text, details

### Font Sizes
- Company Name: 24pt
- Receipt Title: 20pt
- Amount: 16pt
- Section Headers: 10-14pt
- Body Text: 9-10pt
- Footer: 8pt

---

## Spacing & Layout

### Margins
- Top: 40mm (includes header)
- Bottom: 30mm (includes footer)
- Left: 20mm
- Right: 20mm

### Section Spacing
- Between sections: 8-10mm
- Between lines: 5-7mm
- Table cell padding: 3mm

---

## Sample Receipts by Type

### Appointment Receipt
```
Type: Appointment
Description: Consultation with Dr. Smith
Items:
  • Consultation - $100.00
  • Vision Screening - $25.00
Total: $125.00
```

### Prescription Receipt
```
Type: Prescription
Description: Prescription from Dr. Johnson
Items:
  • Progressive Lenses - $150.00
  • Anti-glare Coating - $25.00
  • Frames - $75.00
Total: $250.00
```

### Service Receipt
```
Type: Service
Description: Eye Examination & Testing
Items:
  • Comprehensive Eye Exam - $100.00
  • Retinal Imaging - $50.00
  • Visual Field Test - $40.00
Total: $190.00
```

---

## Print Quality

**Resolution**: Vector-based (scalable)
**Quality**: Print-ready
**Compatible with**: All PDF readers
**Printable**: Yes (recommended on A4 paper)

---

## Accessibility Features

- ✅ High contrast text
- ✅ Clear, readable fonts
- ✅ Logical reading order
- ✅ Proper text hierarchy
- ✅ Screen reader compatible

---

## Professional Features

1. **Consistent Branding**: Company colors throughout
2. **Clear Information Hierarchy**: Important details emphasized
3. **Professional Layout**: Clean, organized structure
4. **Official Appearance**: Looks like official receipt
5. **Complete Details**: All necessary information included
6. **Archival Quality**: Suitable for record keeping

---

## How It Looks When Downloaded

1. **Browser Download**: Appears in downloads folder
2. **Filename**: Descriptive and organized
3. **Opens in**: Default PDF viewer
4. **Viewable**: Immediately readable
5. **Shareable**: Can be emailed or printed

---

## Comparison with Invoice

| Feature | Invoice | Receipt |
|---------|---------|---------|
| Purpose | Request payment | Confirm payment |
| Status | Pending/Unpaid | Paid |
| Stamp | None | "PAID" |
| Color Accent | Orange/Yellow | Green |
| Action | Pay Now | Download |

---

## Real-World Examples

**Use Cases:**
1. Patient downloads after appointment payment
2. Pharmacy purchase confirmation
3. Insurance claim documentation
4. Tax records
5. Personal financial tracking
6. Reimbursement requests

---

## Technical Details

**Generated by**: jsPDF v3.0.3
**Table plugin**: jspdf-autotable v5.0.2
**Format**: PDF 1.3 or higher
**Encoding**: UTF-8
**Compression**: Enabled

---

## Notes

- PDF is generated **client-side** (in browser)
- No server processing required
- Instant download upon generation
- Works offline after page load
- No data sent to external services

---

**This is a representation of the actual PDF output. The real PDF will have proper formatting, colors, and typography as specified.**


