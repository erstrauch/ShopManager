import { useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	Divider,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { EtsyProductSummary, fetchEtsyShopListings } from '../lib/etsy';

export default function EtsyListings() {
	const [listings, setListings] = useState<EtsyProductSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const apiKey = import.meta.env.VITE_ETSY_API_KEY;
		const shopId = import.meta.env.VITE_ETSY_SHOP_ID;

		if (!apiKey || !shopId) {
			setError(
				'Missing Etsy credentials. Add VITE_ETSY_API_KEY and VITE_ETSY_SHOP_ID to your .env file.',
			);
			setLoading(false);
			return;
		}

		fetchEtsyShopListings(shopId, apiKey)
			.then((result) => {
				setListings(result);
			})
			.catch((fetchError) => {
				setError(fetchError?.message ?? 'Failed to load Etsy listings.');
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return (
		<Card variant="outlined" sx={{ marginTop: 4 }}>
			<CardHeader
				title="Etsy product sales"
				subheader="Name, sold count, and revenue per item from your Etsy shop"
			/>
			<Divider />
			<CardContent>
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress />
					</Box>
				) : error ? (
					<Alert severity="error">{error}</Alert>
				) : listings.length === 0 ? (
					<Typography>No active Etsy listings found.</Typography>
				) : (
					<TableContainer component={Paper} variant="outlined">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Product name</TableCell>
									<TableCell>Number sold</TableCell>
									<TableCell>Price per item</TableCell>
									<TableCell>Amount sold</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{listings.map((listing) => (
									<TableRow key={listing.listingId}>
										<TableCell>{listing.name}</TableCell>
										<TableCell>
											{listing.numberSold !== null ? listing.numberSold : 'N/A'}
										</TableCell>
										<TableCell>
											{listing.currency} {listing.pricePerItem.toFixed(2)}
										</TableCell>
										<TableCell>
											{listing.amountSold !== null
												? `${listing.currency} ${listing.amountSold.toFixed(2)}`
												: 'N/A'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
}
