# KR Pricing Changes - December 8, 2025

## Session Summary

### 1. Customer Dropdown Improvements (commit `bf69e07`)

**Changes:**
- Renamed generic column customers from "1 Column Customer" to "Column 1", etc.
- Updated frontend dropdown to sort customers with Column 1-10 appearing first (numerically sorted), followed by real customers alphabetically
- Customers now display as: `Name (column_break)` e.g., "ABC Plastics (VN8ST6PC4PE0SA0AP0)"

**Files Modified:**
- `backend/config/customers.json`
- `backend-deploy/config/customers.json`
- `frontend/src/App.tsx`

### 2. Minimum Order Logic Fix (commit `2e3fa47`)

**Problem:**
The $550 minimum was being applied to ALL stock orders where width > 47". This was incorrect.

**Fix:**
The $550 minimum should only apply to large sheets (40x72 or larger). Smaller sheets should have the $150 minimum.

**New Logic:**
- $150 minimum: Default for all orders
- $550 minimum: Only for sheets where:
  - The smaller dimension is >= 40"
  - The larger dimension is >= 72"

**Examples:**
| Sheet Size | Minimum |
|------------|---------|
| 48x48 | $150 |
| 36x48 | $150 |
| 40x72 | $550 |
| 48x96 | $550 |

**Files Modified:**
- `backend/pricing/core.py` - Updated `apply_order_minimums()` function
- `backend/pricing/custom_rules.py` - Changed constants from `WIDE_SHEET_THRESHOLD` to `LARGE_SHEET_MIN/MAX_DIMENSION`
- `backend-deploy/pricing/core.py` - Same changes for deploy version
- `backend-deploy/pricing/custom_rules.py` - Same changes for deploy version
- `frontend/src/types.ts` - Updated constants for consistency

### Deployment

- **Frontend:** Azure Static Web Apps at https://krpricingweb.z19.web.core.windows.net/
- **Backend:** Render.com (auto-deploys from GitHub)
- **Repository:** https://github.com/jaaronsanderson/kr-pricing
