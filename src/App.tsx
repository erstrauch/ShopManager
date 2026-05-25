import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Item from './Pages/Item/Item';
import Product from './Pages/Product/Product';
import Navigation from './components/Navigation';

function App() {
	return (
		<>
			<Navigation />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/item" element={<Item />} />
				<Route path="/product" element={<Product />} />
			</Routes>
		</>
	);
}

export default App;
