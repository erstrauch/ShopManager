import { useState, useEffect, useRef } from 'react';
import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	IconButton,
	Tooltip,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
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
	// Cache parsed items in a ref so we only parse localStorage once per session
	const parsedItemsRef = useRef<Item[] | null>(null);
	const [items, setItems] = useState<Item[]>(() => {
		if (parsedItemsRef.current) return parsedItemsRef.current;
		if (typeof window === 'undefined' || !window.localStorage) {
			return [];
		}
		const saved = localStorage.getItem('shopManagerItems');
		if (!saved) {
			parsedItemsRef.current = [];
			return [];
		}
		try {
			const parsed = JSON.parse(saved);
			const arr = Array.isArray(parsed) ? parsed : [];
			parsedItemsRef.current = arr;
			return arr;
		} catch (e) {
			console.error('Failed to parse saved items', e);
			parsedItemsRef.current = [];
			return [];
		}
	});

	const [entryInputs, setEntryInputs] = useState<
		Record<string, { uid: string; price: string; count: string }>
	>({});
	const [itemName, setItemName] = useState('');
	const [itemError, setItemError] = useState('');
	const [csvError, setCSVError] = useState('');
	const [csvSuccess, setCSVSuccess] = useState('');

	// Sorting state
	const [sortField, setSortField] = useState<'name' | 'uid' | 'price'>('name');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

	const handleSortFieldChange = (
		event: SelectChangeEvent<'name' | 'uid' | 'price'>,
	) => {
		setSortField(event.target.value as 'name' | 'uid' | 'price');
	};
	const handleSortDirectionToggle = () => {
		setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
	};

	useEffect(() => {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem('shopManagerItems', JSON.stringify(items));
			parsedItemsRef.current = items;
		}
	}, [items]);
	// Pagination state
	const [page, setPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const handlePageChange = (newPage: number) => setPage(newPage);
	const handleItemsPerPageChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setItemsPerPage(Number(event.target.value));
		setPage(1); // Reset to first page when page size changes
	};

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

	const handleCSVUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setCSVError('');
		setCSVSuccess('');

		const text = await file.text();
		const rows = text
			.split(/\r?\n/)
			.map((row) => row.trim())
			.filter(Boolean)
			.map((row) => row.split(',').map((cell) => cell.trim()));

		if (rows.length === 0) {
			setCSVError('CSV file is empty or malformed.');
			event.target.value = '';
			return;
		}

		const header = rows[0].map((cell) => cell.toLowerCase());
		const requiredHeaders = ['name', 'uid', 'price', 'count'];
		const headerIndexes: Record<string, number> = {};

		for (const required of requiredHeaders) {
			const index = header.findIndex((cell) => cell === required);
			if (index === -1) {
				setCSVError(
					`CSV must include header columns: Name, UID, Price, Count. Missing: ${required}`,
				);
				event.target.value = '';
				return;
			}
			headerIndexes[required] = index;
		}

		const parsedRows = rows
			.slice(1)
			.filter((row) => row.some((cell) => cell !== ''));
		if (parsedRows.length === 0) {
			setCSVError('CSV does not contain any data rows.');
			event.target.value = '';
			return;
		}

		const importedRows = parsedRows.map((row) => {
			const name = row[headerIndexes.name] ?? '';
			const uid = row[headerIndexes.uid] ?? '';
			const price = parseFloat(row[headerIndexes.price] ?? '0');
			const count = parseInt(row[headerIndexes.count] ?? '0', 10);
			return {
				name: name.trim(),
				uid: uid.trim(),
				price: Number.isFinite(price) ? price : 0,
				count: Number.isFinite(count) ? Math.max(0, count) : 0,
			};
		});

		const validRows = importedRows.filter((row) => row.name && row.uid);
		if (validRows.length === 0) {
			setCSVError('CSV rows must include Name and UID values.');
			event.target.value = '';
			return;
		}

		const newEntryInputs: Record<
			string,
			{ uid: string; price: string; count: string }
		> = {};
		let importedCount = 0;
		const nextItems = validRows.reduce<Item[]>(
			(updated, row) => {
				const existingItem = updated.find(
					(item) => item.name.toLowerCase() === row.name.toLowerCase(),
				);

				if (existingItem) {
					const uidExists = existingItem.entries.some(
						(entry) => entry.uid === row.uid,
					);
					if (!uidExists) {
						existingItem.entries = [
							...existingItem.entries,
							{
								id: newId(),
								uid: row.uid,
								price: row.price,
								count: row.count,
							},
						];
						importedCount += 1;
					}
				} else {
					// Only add a new item if UID is present
					if (row.uid) {
						const newItem = {
							id: newId(),
							name: row.name,
							entries: [
								{
									id: newId(),
									uid: row.uid,
									price: row.price,
									count: row.count,
								},
							],
						};
						updated.push(newItem);
						newEntryInputs[newItem.id] = { uid: '', price: '0', count: '1' };
						importedCount += 1;
					}
				}

				return updated;
			},
			[...items],
		);

		setItems(nextItems);
		setEntryInputs((prev) => ({
			...prev,
			...newEntryInputs,
		}));

		if (importedCount > 0) {
			setCSVSuccess(`Imported ${importedCount} row(s).`);
		} else {
			setCSVError(
				'No new rows were imported because matching UIDs already exist.',
			);
		}
		event.target.value = '';
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		console.log(event.target.value, 'event');
	};

	return (
		<Box className="item" sx={{ padding: 3, maxWidth: 1000, margin: '0 auto' }}>
			<Typography variant="h4" gutterBottom>
				Items
			</Typography>

			<TextField
				label="Search items by name"
				// value={search}
				onChange={handleSearchChange}
				size="small"
				sx={{ mb: 2, background: '#fff', color: '#222', width: 300 }}
			/>

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

			<Card variant="outlined" sx={{ marginBottom: 4 }}>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="body1">
							Upload a CSV file formatted with columns: Name, UID, Price, and
							Count. Matching Name values will add a UID/Price/Count entry to an
							existing item. Non-matching names create a new item.
						</Typography>
						<Button variant="contained" component="label" fullWidth>
							Upload CSV
							<input
								type="file"
								accept=".csv,text/csv"
								hidden
								onChange={handleCSVUpload}
							/>
						</Button>
						{csvError && <Typography color="error">{csvError}</Typography>}
						{csvSuccess && (
							<Typography color="success.main">{csvSuccess}</Typography>
						)}
					</Stack>
				</CardContent>
			</Card>

			{items.length === 0 ? (
				<Typography>No items added yet.</Typography>
			) : (
				<>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2}
						sx={{ mb: 2, alignItems: 'center' }}
					>
						<FormControl size="small" sx={{ minWidth: 140 }}>
							<InputLabel
								id="sort-field-label"
								sx={{
									color: '#fff',
									background: '#222',
									px: 0.5,
									borderRadius: 1,
								}}
							>
								Sort by
							</InputLabel>
							<Select
								labelId="sort-field-label"
								value={sortField}
								label="Sort by"
								onChange={handleSortFieldChange}
								sx={{
									background: '#fff',
									color: '#222',
									'.MuiSelect-icon': { color: '#222' },
									'.MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
								}}
							>
								<MenuItem value="name">Name</MenuItem>
								<MenuItem value="uid">UID</MenuItem>
								<MenuItem value="price">Price</MenuItem>
							</Select>
						</FormControl>
						<Tooltip
							title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
						>
							<IconButton
								onClick={handleSortDirectionToggle}
								size="small"
								sx={{
									background: '#fff',
									color: '#222',
									border: '1px solid #ccc',
									'&:hover': { background: '#f5f5f5' },
								}}
							>
								{sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
							</IconButton>
						</Tooltip>
					</Stack>
					{/* Pagination controls */}
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2}
						sx={{ mb: 2, alignItems: 'center' }}
					>
						<TextField
							select
							label="Items per page"
							value={itemsPerPage}
							onChange={handleItemsPerPageChange}
							size="small"
							sx={{ width: 140, background: '#fff', color: '#222' }}
						>
							{[5, 10, 20, 50, 100].map((n) => (
								<MenuItem key={n} value={n}>
									{n}
								</MenuItem>
							))}
						</TextField>
						<span style={{ color: '#fff' }}>Page {page}</span>
						<Button
							variant="outlined"
							size="small"
							onClick={() => handlePageChange(Math.max(1, page - 1))}
							disabled={page === 1}
							sx={{
								background: '#fff',
								color: '#222',
								border: '1px solid #ccc',
							}}
						>
							Prev
						</Button>
						<Button
							variant="outlined"
							size="small"
							onClick={() => handlePageChange(page + 1)}
							disabled={(() => {
								// Calculate total pages
								let sortedItems = [...items];
								if (sortField === 'name') {
									sortedItems.sort((a, b) => {
										const cmp = a.name.localeCompare(b.name);
										return sortDirection === 'asc' ? cmp : -cmp;
									});
								} else if (sortField === 'uid') {
									sortedItems.sort((a, b) => {
										const aUid = a.entries[0]?.uid || '';
										const bUid = b.entries[0]?.uid || '';
										const cmp = aUid.localeCompare(bUid);
										return sortDirection === 'asc' ? cmp : -cmp;
									});
								} else if (sortField === 'price') {
									sortedItems.sort((a, b) => {
										const aPrice = a.entries[0]?.price ?? 0;
										const bPrice = b.entries[0]?.price ?? 0;
										const cmp = aPrice - bPrice;
										return sortDirection === 'asc' ? cmp : -cmp;
									});
								}
								const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
								return page >= totalPages;
							})()}
							sx={{
								background: '#fff',
								color: '#222',
								border: '1px solid #ccc',
							}}
						>
							Next
						</Button>
					</Stack>
					<Stack spacing={3}>
						{(() => {
							// Sorting logic for items
							let sortedItems = [...items];
							if (sortField === 'name') {
								sortedItems.sort((a, b) => {
									const cmp = a.name.localeCompare(b.name);
									return sortDirection === 'asc' ? cmp : -cmp;
								});
							} else if (sortField === 'uid') {
								sortedItems.sort((a, b) => {
									const aUid = a.entries[0]?.uid || '';
									const bUid = b.entries[0]?.uid || '';
									const cmp = aUid.localeCompare(bUid);
									return sortDirection === 'asc' ? cmp : -cmp;
								});
							} else if (sortField === 'price') {
								sortedItems.sort((a, b) => {
									const aPrice = a.entries[0]?.price ?? 0;
									const bPrice = b.entries[0]?.price ?? 0;
									const cmp = aPrice - bPrice;
									return sortDirection === 'asc' ? cmp : -cmp;
								});
							}
							// Pagination logic
							const startIdx = (page - 1) * itemsPerPage;
							const pagedItems = sortedItems.slice(
								startIdx,
								startIdx + itemsPerPage,
							);
							return pagedItems.map((item) => {
								// ...existing code for rendering each item...
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
								let sortedEntries = [...item.entries];
								if (sortField === 'uid') {
									sortedEntries.sort((a, b) => {
										const cmp = a.uid.localeCompare(b.uid);
										return sortDirection === 'asc' ? cmp : -cmp;
									});
								} else if (sortField === 'price') {
									sortedEntries.sort((a, b) => {
										const cmp = a.price - b.price;
										return sortDirection === 'asc' ? cmp : -cmp;
									});
								}
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
																{sortedEntries.map((entry) => (
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
															updateItemInput(
																item.id,
																'uid',
																event.target.value,
															)
														}
														fullWidth
													/>
													<TextField
														label="Price"
														value={entryDraft.price}
														onChange={(event) =>
															updateItemInput(
																item.id,
																'price',
																event.target.value,
															)
														}
														type="number"
														fullWidth
													/>
													<TextField
														label="Count"
														value={entryDraft.count}
														onChange={(event) =>
															updateItemInput(
																item.id,
																'count',
																event.target.value,
															)
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
							});
						})()}
					</Stack>
				</>
			)}
		</Box>
	);
}
