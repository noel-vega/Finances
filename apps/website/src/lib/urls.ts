// Merchant app lives on a different subdomain (merchant.ordersail.com).
// PUBLIC_MERCHANT_SIGNUP_URL lets a preview/staging build retarget the funnel.
export const signupUrl =
	import.meta.env.PUBLIC_MERCHANT_SIGNUP_URL ?? 'https://merchant.ordersail.com/signup';

// Existing merchants sign in on the same app, same origin as signup.
export const signinUrl = new URL('/signin', signupUrl).href;
