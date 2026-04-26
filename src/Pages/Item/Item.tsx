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
} from '@mui/material';
import './Item.css';

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

function newId() {
	return (
		crypto?.randomUUID?.() ??
		`${Date.now()}-${Math.random().toString(36).slice(2)}`
	);
}

export default function Item() {
	const [items, setItems] = useState<Item[]>(() => {
		if (typeof window === 'undefined' || !window.localStorage) {
			return [];
		}

		const saved = localStorage.getItem('shopManagerItems');
		if (!saved) {
			return [];
		}

		try {
			const parsed = JSON.parse(saved);
			console.log('Loading items from localStorage:', parsed);
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			console.error('Failed to parse saved items', e);
			return [];
		}
	});
	const [entryInputs, setEntryInputs] = useState<
		Record<string, { uid: string; price: string; count: string }>
	>({});
	const [itemName, setItemName] = useState('');
	const [itemError, setItemError] = useState('');

	useEffect(() => {
		if (typeof window !== 'undefined' && window.localStorage) {
			console.log('Saving items to localStorage:', items);
			localStorage.setItem('shopManagerItems', JSON.stringify(items));
		}
	}, [items]);

	const handleAddItem = () => {
		const trimmedName = itemName.trim();
		if (!trimmedName) {
			setItemError('Enter an item name.');
			return;
		}

		const newItem = {
			id: newId(),
			name: trimmedName,
			entries: [],
		};

		setItems((prev) => [...prev, newItem]);
		setEntryInputs((prev) => ({
			...prev,
			[newItem.id]: { uid: '', price: '0', count: '1' },
		}));
		setItemName('');
		setItemError('');
	};

	const updateItemInput = (
		itemId: string,
		field: 'uid' | 'price' | 'count',
		value: string,
	) => {
		setEntryInputs((prev) => {
			const current = prev[itemId] ?? { uid: '', price: '0', count: '1' };
			return {
				...prev,
				[itemId]: {
					...current,
					[field]: value,
				},
			};
		});
	};

	const handleAddEntry = (itemId: string) => {
		const draft = entryInputs[itemId] ?? {
			uid: '',
			price: '0',
			count: '1',
		};
		const uid = draft.uid.trim();
		const price = parseFloat(draft.price);
		const count = parseInt(draft.count, 10);
		if (!uid) return;

		setItems((prev) =>
			prev.map((item) => {
				if (item.id !== itemId) return item;

				return {
					...item,
					entries: [
						...item.entries,
						{
							id: newId(),
							uid,
							price: Number.isFinite(price) ? price : 0,
							count: Math.max(0, count || 0),
						},
					],
				};
			}),
		);

		setEntryInputs((prev) => ({
			...prev,
			[itemId]: { uid: '', price: '0', count: '1' },
		}));
	};

	const updateEntry = (
		itemId: string,
		entryId: string,
		field: 'uid' | 'price' | 'count',
		value: string,
	) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id !== itemId
					? item
					: {
							...item,
							entries: item.entries.map((entry) =>
								entry.id !== entryId
									? entry
									: {
											...entry,
											[field]:
												field === 'uid'
													? value
													: field === 'price'
														? Math.max(0, Number(value) || 0)
														: Math.max(0, parseInt(value, 10) || 0),
										},
							),
						},
			),
		);
	};

	const removeEntry = (itemId: string, entryId: string) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id !== itemId
					? item
					: {
							...item,
							entries: item.entries.filter((entry) => entry.id !== entryId),
						},
			),
		);
	};

	const handleRemoveItem = (itemId: string) => {
		setItems((prev) => prev.filter((item) => item.id !== itemId));
		setEntryInputs((prev) => {
			const newInputs = { ...prev };
			delete newInputs[itemId];
			return newInputs;
		});
	};

	return (
		<Box className="item" sx={{ padding: 3, maxWidth: 1000, margin: '0 auto' }}>
			<Typography variant="h4" gutterBottom>
				Items
			</Typography>

			<Card variant="outlined" sx={{ marginBottom: 4 }}>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="body1">
							Add an item name, then enter nested entries for UID, Price, and
							Count.
						</Typography>

						<Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
							<TextField
								label="Item name"
								value={itemName}
								onChange={(event) => setItemName(event.target.value)}
								fullWidth
								error={Boolean(itemError)}
								helperText={itemError}
							/>
							<Button variant="contained" onClick={handleAddItem} fullWidth>
								Add item
							</Button>
						</Stack>
					</Stack>
				</CardContent>
			</Card>

			{items.length === 0 ? (
				<Typography>No items added yet.</Typography>
			) : (
				<Stack spacing={3}>
					{items.map((item) => {
						const entryDraft = entryInputs[item.id] ?? {
							uid: '',
							price: '0',
							count: '1',
						};
						const totalPrice = item.entries.reduce(
							(sum, entry) => sum + entry.price,
							0,
						);
						const totalCount = item.entries.reduce(
							(sum, entry) => sum + entry.count,
							0,
						);

						return (
							<Card key={item.id} variant="outlined">
								<CardHeader
									title={item.name}
									action={
										<Button
											variant="outlined"
											color="error"
											onClick={() => handleRemoveItem(item.id)}
										>
											Remove Item
										</Button>
									}
								/>
								<Divider />
								<CardContent>
									<Stack spacing={3}>
										{item.entries.length === 0 ? (
											<Typography color="text.secondary">
												No nested entries yet.
											</Typography>
										) : (
											<TableContainer component={Paper} variant="outlined">
												<Table size="small">
													<TableHead>
														<TableRow>
															<TableCell>UID</TableCell>
															<TableCell>Price</TableCell>
															<TableCell>Count</TableCell>
															<TableCell align="right">Actions</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{item.entries.map((entry) => (
															<TableRow key={entry.id}>
																<TableCell>
																	<TextField
																		label="UID"
																		value={entry.uid}
																		onChange={(event) =>
																			updateEntry(
																				item.id,
																				entry.id,
																				'uid',
																				event.target.value,
																			)
																		}
																		fullWidth
																		variant="standard"
																	/>
																</TableCell>
																<TableCell>
																	<TextField
																		label="Price"
																		value={entry.price.toString()}
																		onChange={(event) =>
																			updateEntry(
																				item.id,
																				entry.id,
																				'price',
																				event.target.value,
																			)
																		}
																		type="number"
																		variant="standard"
																	/>
																</TableCell>
																<TableCell>
																	<TextField
																		label="Count"
																		value={entry.count.toString()}
																		onChange={(event) =>
																			updateEntry(
																				item.id,
																				entry.id,
																				'count',
																				event.target.value,
																			)
																		}
																		type="number"
																		variant="standard"
																	/>
																</TableCell>
																<TableCell align="right">
																	<Button
																		variant="outlined"
																		color="error"
																		onClick={() =>
																			removeEntry(item.id, entry.id)
																		}
																	>
																		Remove
																	</Button>
																</TableCell>
															</TableRow>
														))}
														<TableRow>
															<TableCell />
															<TableCell sx={{ fontWeight: 'bold' }}>
																Total Price: {totalPrice}
															</TableCell>
															<TableCell sx={{ fontWeight: 'bold' }}>
																Total Count: {totalCount}
															</TableCell>
															<TableCell
																align="right"
																sx={{ fontWeight: 'bold' }}
															>
																{totalCount > 0
																	? `Cost / Amount: ${(totalPrice / totalCount).toFixed(2)}`
																	: 'Cost / Amount: -'}
															</TableCell>
														</TableRow>
													</TableBody>
												</Table>
											</TableContainer>
										)}

										<Divider />
										<Stack
											sx={{
												flexDirection: { xs: 'column', md: 'row' },
												alignItems: 'flex-end',
												gap: 2,
											}}
										>
											<TextField
												label="UID"
												value={entryDraft.uid}
												onChange={(event) =>
													updateItemInput(item.id, 'uid', event.target.value)
												}
												fullWidth
											/>
											<TextField
												label="Price"
												value={entryDraft.price}
												onChange={(event) =>
													updateItemInput(item.id, 'price', event.target.value)
												}
												type="number"
												fullWidth
											/>
											<TextField
												label="Count"
												value={entryDraft.count}
												onChange={(event) =>
													updateItemInput(item.id, 'count', event.target.value)
												}
												type="number"
												fullWidth
											/>
											<Button
												variant="outlined"
												onClick={() => handleAddEntry(item.id)}
												fullWidth
											>
												Add entry
											</Button>
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						);
					})}
				</Stack>
			)}
		</Box>
	);
}
