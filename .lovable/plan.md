

## Problem

Three issues with the password reset flow on production:

1. **Email link is raw Supabase URL** — `https://vklavozvzfqhxzoczqnp.supabase.co/auth/v1/verify?token=...` instead of a human-readable `https://demo.admin.n2wash.com/reset-password?token=...&type=recovery`
2. **Reset page missing confirm password field** — no "Powtórz hasło" input
3. **Requirements hidden until typing + button stays disabled** — validation requirements should always be visible, and the button is blocked even when password meets all criteria (because `isFormValid` in `usePasswordValidation` requires `confirmMatch` which is never true without a confirm field)

## Root cause of disabled button

`usePasswordValidation.isFormValid` = `validation.isValid && confirmMatch`. Since ResetPassword.tsx never uses `confirmPassword`/`setConfirmPassword`, `confirmMatch` is always `false`, so the button is permanently disabled. This is a regression from when the confirm field was removed from the reset page.

## Changes

### 1. Edge function: generate human-readable link

**File:** `supabase/functions/send-password-reset-email/index.ts`

The `generateLink` API returns a Supabase verification URL. Instead of using it directly as `resetUrl`, extract the token from it and construct a human-readable URL pointing to the app's `/reset-password` page:

```
// After generateLink:
const actionLink = linkData.properties.action_link;
const url = new URL(actionLink);
const token = url.searchParams.get("token");
const type = url.searchParams.get("type");
const humanReadableUrl = `${redirectTo}?token=${token}&type=${type}`;
```

Use `humanReadableUrl` for both the button href and the "copy link" text in the email.

### 2. ResetPassword.tsx: handle token from query params

Currently the page only checks `window.location.hash` and the `PASSWORD_RECOVERY` auth event. With the new human-readable URL, the token arrives as a query parameter (`?token=...&type=recovery`).

Add logic to:
- Parse `?token` and `?type` from query params
- If `type=recovery` and token exists, call `supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })` to establish the session
- Set `isRecoveryMode = true` on success

### 3. ResetPassword.tsx: add confirm password field

- Use `confirmPassword` and `setConfirmPassword` from `usePasswordValidation`
- Add `PasswordConfirmInput` below the password field
- Now `isFormValid` will correctly enable the button when both passwords match and validation passes

### 4. PasswordInput: always show requirements

**File:** `src/components/password/PasswordInput.tsx`

Change the condition on line 103 from:
```
{showRequirements && value.length > 0 && (
```
to:
```
{showRequirements && (
```

This makes requirements always visible (with unmet state shown in muted color when empty).

### 5. PasswordInput: show strength meter label even when empty

Keep strength meter hidden when empty (that's fine), but requirements must be visible from the start.

## Technical details

- The `verifyOtp` call with `token_hash` + `type: 'recovery'` establishes the auth session needed for `updateUser({ password })` to work
- The human-readable URL avoids exposing the Supabase project ID in emails
- `validatePassword("")` returns all requirements as `met: false` with `isValid: false`, so showing them empty is correct UX — user sees what's needed before typing

