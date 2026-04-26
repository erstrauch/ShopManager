import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box } from '@mui/material';

function Navigation() {
	const location = useLocation();

	return (
		<AppBar position="static" sx={{ mb: 2 }}>
			<Toolbar>
				<Box sx={{ flexGrow: 1 }}>
					<Button
						color="inherit"
						component={Link}
						to="/"
						sx={{
							fontWeight: location.pathname === '/' ? 'bold' : 'normal',
							textDecoration: location.pathname === '/' ? 'underline' : 'none',
						}}
					>
						Home
					</Button>
					<Button
						color="inherit"
						component={Link}
						to="/item"
						sx={{
							fontWeight: location.pathname === '/item' ? 'bold' : 'normal',
							textDecoration:
								location.pathname === '/item' ? 'underline' : 'none',
						}}
					>
						Items
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
}

export default Navigation;
