interface ImportMetaEnv {
	/**
	 * Merchant signup URL the marketing-site CTAs point at. Defaults to
	 * https://merchant.ordersail.com/signup; override for preview/staging builds.
	 */
	readonly PUBLIC_MERCHANT_SIGNUP_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
