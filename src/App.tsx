import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home/Home';
import Item from './Pages/Item/Item';
import Navigation from './components/Navigation';

function App() {
	return (
		<>
			<Navigation />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/item" element={<Item />} />
			</Routes>
		</>
	);
}

export default App;
