import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>

      <footer className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm mt-auto border-t border-zinc-200 dark:border-zinc-800">
        <p>&copy; {new Date().getFullYear()} SalesHub. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App;
