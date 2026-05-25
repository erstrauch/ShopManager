import { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Divider,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
} from '@mui/material';
// import EtsyListings from '../../components/EtsyListings';
import './Product.css';

type NestedEntry = {
	id: string;
	uid: string;
	price: number;
	count: number;
};

type Item = {
	id: string;
	name: string;
	entries: NestedEntry[];
};

type ProductComponent = {
	itemId: string;
	quantity: number;
};

type Product = {
	id: string;
	name: string;
	components: ProductComponent[];
};

function newId() {
	return (
		crypto?.randomUUID?.() ??
		`${Date.now()}-${Math.random().toString(36).slice(2)}`
	);
}

export default function Product() {
	const [items, setItems] = useState<Item[]>([]);
	const [products, setProducts] = useState<Product[]>(() => {
		if (typeof window === 'undefined' || !window.localStorage) {
			return [];
		}

		const saved = localStorage.getItem('shopManagerProducts');
		if (!saved) {
			return [];
		}

		try {
			const parsed = JSON.parse(saved);
			console.log('Loading products from localStorage:', parsed);
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			console.error('Failed to parse saved products', e);
			return [];
		}
	});

	const [productName, setProductName] = useState('');
	const [selectedItemId, setSelectedItemId] = useState('');
	const [componentQuantity, setComponentQuantity] = useState('1');
	const [productComponents, setProductComponents] = useState<
		ProductComponent[]
	>([]);
	const [productError, setProductError] = useState('');

	// Load items from localStorage
	useEffect(() => {
		const loadItems = () => {
			if (typeof window === 'undefined' || !window.localStorage) {
				return [];
			}

			const saved = localStorage.getItem('shopManagerItems');
			if (!saved) {
				return [];
			}

			try {
				const parsed = JSON.parse(saved);
				return Array.isArray(parsed) ? parsed : [];
			} catch (e) {
				console.error('Failed to parse saved items', e);
				return [];
			}
		};

		setItems(loadItems());
	}, []);

	// Save products to localStorage
	useEffect(() => {
		if (typeof window !== 'undefined' && window.localStorage) {
			console.log('Saving products to localStorage:', products);
			localStorage.setItem('shopManagerProducts', JSON.stringify(products));
		}
	}, [products]);

	const handleAddComponent = () => {
		if (!selectedItemId || !componentQuantity) return;

		const quantity = parseInt(componentQuantity, 10);
		if (quantity <= 0) return;

		// Check if component already exists
		const existingIndex = productComponents.findIndex(
			(comp) => comp.itemId === selectedItemId,
		);

		if (existingIndex >= 0) {
			// Update existing component
			setProductComponents((prev) =>
				prev.map((comp, index) =>
					index === existingIndex
						? { ...comp, quantity: comp.quantity + quantity }
						: comp,
				),
			);
		} else {
			// Add new component
			setProductComponents((prev) => [
				...prev,
				{ itemId: selectedItemId, quantity },
			]);
		}

		setSelectedItemId('');
		setComponentQuantity('1');
	};

	const handleRemoveComponent = (itemId: string) => {
		setProductComponents((prev) =>
			prev.filter((comp) => comp.itemId !== itemId),
		);
	};

	const handleAddProduct = () => {
		const trimmedName = productName.trim();
		if (!trimmedName) {
			setProductError('Enter a product name.');
			return;
		}

		if (productComponents.length === 0) {
			setProductError('Add at least one component to the product.');
			return;
		}

		const newProduct = {
			id: newId(),
			name: trimmedName,
			components: productComponents,
		};

		setProducts((prev) => [...prev, newProduct]);
		setProductName('');
		setProductComponents([]);
		setProductError('');
	};

	const handleRemoveProduct = (productId: string) => {
		setProducts((prev) => prev.filter((product) => product.id !== productId));
	};

	const getItemName = (itemId: string) => {
		const item = items.find((item) => item.id === itemId);
		return item ? item.name : 'Unknown Item';
	};

	const getTotalCost = (product: Product) => {
		return product.components.reduce((total, comp) => {
			const item = items.find((item) => item.id === comp.itemId);
			if (!item) return total;

			const itemTotalPrice = item.entries.reduce(
				(sum, entry) => sum + entry.price,
				0,
			);
			const itemTotalCount = item.entries.reduce(
				(sum, entry) => sum + entry.count,
				0,
			);

			const avgPrice = itemTotalCount > 0 ? itemTotalPrice / itemTotalCount : 0;
			return total + avgPrice * comp.quantity;
		}, 0);
	};

	return (
		<Box
			className="product"
			sx={{ padding: 3, maxWidth: 1000, margin: '0 auto' }}
		>
			<Typography variant="h4" gutterBottom>
				Products
			</Typography>

			<Card variant="outlined" sx={{ marginBottom: 4 }}>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="body1">
							Create finished products by combining items that have been added
							on the Items page.
						</Typography>

						<Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
							<TextField
								label="Product name"
								value={productName}
								onChange={(event) => setProductName(event.target.value)}
								fullWidth
								error={Boolean(productError)}
								helperText={productError}
							/>
							<Button variant="contained" onClick={handleAddProduct} fullWidth>
								Add product
							</Button>
						</Stack>

						{items.length === 0 ? (
							<Typography color="text.secondary">
								No items available. Add items on the Items page first.
							</Typography>
						) : (
							<>
								<Divider />
								<Typography variant="h6">Add Components</Typography>
								<Stack
									sx={{
										flexDirection: { xs: 'column', md: 'row' },
										alignItems: 'flex-end',
										gap: 2,
									}}
								>
									<FormControl fullWidth>
										<InputLabel>Select Item</InputLabel>
										<Select
											value={selectedItemId}
											label="Select Item"
											onChange={(event) =>
												setSelectedItemId(event.target.value)
											}
										>
											{items.map((item) => (
												<MenuItem key={item.id} value={item.id}>
													{item.name}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<TextField
										label="Quantity"
										value={componentQuantity}
										onChange={(event) =>
											setComponentQuantity(event.target.value)
										}
										type="number"
										fullWidth
									/>
									<Button
										variant="outlined"
										onClick={handleAddComponent}
										disabled={!selectedItemId}
										fullWidth
									>
										Add Component
									</Button>
								</Stack>

								{productComponents.length > 0 && (
									<Box>
										<Typography variant="subtitle1" sx={{ mt: 2 }}>
											Components to be added:
										</Typography>
										<Stack
											direction="row"
											spacing={1}
											sx={{ flexWrap: 'wrap' }}
										>
											{productComponents.map((comp) => (
												<Chip
													key={comp.itemId}
													label={`${getItemName(comp.itemId)} (x${comp.quantity})`}
													onDelete={() => handleRemoveComponent(comp.itemId)}
													color="primary"
													variant="outlined"
												/>
											))}
										</Stack>
									</Box>
								)}
							</>
						)}
					</Stack>
				</CardContent>
			</Card>

			{products.length === 0 ? (
				<Typography>No products added yet.</Typography>
			) : (
				<Stack spacing={3}>
					{products.map((product) => (
						<Card key={product.id} variant="outlined">
							<CardHeader
								title={product.name}
								action={
									<Button
										variant="outlined"
										color="error"
										onClick={() => handleRemoveProduct(product.id)}
									>
										Remove Product
									</Button>
								}
							/>
							<Divider />
							<CardContent>
								<Stack spacing={3}>
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Component Item</TableCell>
													<TableCell>Quantity</TableCell>
													<TableCell>Estimated Cost</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{product.components.map((comp) => {
													const item = items.find(
														(item) => item.id === comp.itemId,
													);
													const itemTotalPrice = item
														? item.entries.reduce(
																(sum, entry) => sum + entry.price,
																0,
															)
														: 0;
													const itemTotalCount = item
														? item.entries.reduce(
																(sum, entry) => sum + entry.count,
																0,
															)
														: 0;
													const avgPrice =
														itemTotalCount > 0
															? itemTotalPrice / itemTotalCount
															: 0;
													const componentCost = avgPrice * comp.quantity;

													return (
														<TableRow key={comp.itemId}>
															<TableCell>{getItemName(comp.itemId)}</TableCell>
															<TableCell>{comp.quantity}</TableCell>
															<TableCell>${componentCost.toFixed(2)}</TableCell>
														</TableRow>
													);
												})}
												<TableRow>
													<TableCell sx={{ fontWeight: 'bold' }}>
														Total Cost
													</TableCell>
													<TableCell />
													<TableCell sx={{ fontWeight: 'bold' }}>
														${getTotalCost(product).toFixed(2)}
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</TableContainer>
								</Stack>
							</CardContent>
						</Card>
					))}
				</Stack>
			)}
			{/* <EtsyListings /> */}
		</Box>
	);
}
