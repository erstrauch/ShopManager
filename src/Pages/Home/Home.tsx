// Home.tsx
import { Box, Typography, Card, CardContent } from '@mui/material';

function Home() {
	return (
		<Box sx={{ padding: 3, maxWidth: 1000, margin: '0 auto' }}>
			<Typography variant="h4" gutterBottom>
				Home Page
			</Typography>

			<Card variant="outlined">
				<CardContent>
					<Typography variant="body1">
						Welcome to the Shop Manager! Use the navigation above to manage your
						items and entries.
					</Typography>
				</CardContent>
			</Card>
		</Box>
	);
}

export default Home;
