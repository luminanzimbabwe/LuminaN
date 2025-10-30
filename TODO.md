# TODO: Fix Token Refresh Issue

## Problem
- Frontend sends POST /api/v1/user/refresh/ every second
- Backend responds with 403 Forbidden
- Splash screen stuck in loading loop
- Refresh token likely invalid or sent incorrectly

## Root Cause
- Backend expects refresh token in HTTP-only cookie with withCredentials: true
- Frontend currently sends refreshToken in request body
- Missing withCredentials: true in axios requests

## Fixes Needed
- [x] Modify apiRefreshToken to use withCredentials: true and send no body
- [x] Update axiosInstance to include withCredentials: true for all requests
- [x] Use direct axios call for refresh to avoid Authorization header
- [x] Change BASE_URL to localhost for testing
- [x] Send refresh_token in request body instead of relying on cookies
- [x] Pass storedRefreshToken to apiRefreshToken in AuthContext
- [ ] Clear AsyncStorage to force fresh login after changes
- [ ] Test token refresh flow

## Files to Edit
- src/services/auth.service.js: Update apiRefreshToken and axiosInstance
- src/context/AuthContext.js: Ensure refresh logic works with cookie-based tokens

## Followup Steps
- [ ] Clear app storage and test fresh login
- [ ] Verify refresh requests succeed (200 instead of 403)
- [ ] Confirm splash screen loads properly
