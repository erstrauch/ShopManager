import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home/Home';
import { Suspense, lazy } from 'react';
const Item = lazy(() => import('./Pages/Item/Item'));
const Product = lazy(() => import('./Pages/Product/Product'));
import Navigation from './components/Navigation';

function App() {
	return (
		<>
			<Navigation />
			<Suspense fallback={<div>Loading...</div>}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/item" element={<Item />} />
					<Route path="/product" element={<Product />} />
				</Routes>
			</Suspense>
		</>
	);
}

export default App;
