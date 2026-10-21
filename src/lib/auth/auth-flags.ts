// Set while this tab verifies a password sign-in (the role check can sign the user
// straight back out). Pages that auto-redirect signed-in users must wait for it.
let signInVerifying = false

export function setSignInVerifying(value: boolean) {
  signInVerifying = value
}

export function isSignInVerifying(): boolean {
  return signInVerifying
}
