export type EtsyListingResponse = {
	listing_id: string | number;
	title: string;
	price: string;
	currency_code: string;
	quantity_sold?: number;
	sold_quantity?: number;
	quantity?: number;
	[key: string]: unknown;
};

export type EtsyProductSummary = {
	listingId: number;
	name: string;
	numberSold: number | null;
	pricePerItem: number;
	currency: string;
	amountSold: number | null;
};

const API_BASE = 'https://openapi.etsy.com/v2';

function parsePrice(price: string): number {
	const parsed = parseFloat(price);
	return Number.isFinite(parsed) ? parsed : 0;
}

function getSoldCount(listing: EtsyListingResponse): number | null {
	if (typeof listing.quantity_sold === 'number') {
		return listing.quantity_sold;
	}
	if (typeof listing.sold_quantity === 'number') {
		return listing.sold_quantity;
	}
	return null;
}

export async function fetchEtsyShopListings(
	shopId: string,
	apiKey: string,
): Promise<EtsyProductSummary[]> {
	const url = `${API_BASE}/shops/${encodeURIComponent(shopId)}/listings/active?api_key=${encodeURIComponent(
		apiKey,
	)}&fields=listing_id,title,price,currency_code,quantity_sold,sold_quantity,quantity`;

	const response = await fetch(url);
	const data = await response.json();

	if (!response.ok) {
		const message =
			(data &&
			typeof data === 'object' &&
			'error' in data &&
			typeof data.error === 'string'
				? data.error
				: response.statusText) || 'Unknown Etsy API error';
		throw new Error(message);
	}

	if (!data || !Array.isArray(data.results)) {
		throw new Error('Unexpected Etsy API response format.');
	}

	return data.results.map((listing: EtsyListingResponse) => {
		const numberSold = getSoldCount(listing);
		const pricePerItem = parsePrice(listing.price ?? '0');
		return {
			listingId: Number(listing.listing_id),
			name: listing.title ?? 'Unknown product',
			numberSold,
			pricePerItem,
			currency: listing.currency_code ?? 'USD',
			amountSold: numberSold !== null ? numberSold * pricePerItem : null,
		};
	});
}
