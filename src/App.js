import './App.css';
import {BrowserRouter as Router, Route, Routes, Link} from "react-router-dom";
import Home from "./pages/Home";
import Puzzle from "./pages/puzzle/Puzzle";

export default function App() {
    return (
        <Router>
            <nav className={'navbar'}>
                <ul className={'links'}>
                    <li><Link className={'link'} to="/">Home</Link></li>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/puzzle" element={<Puzzle/>}/>
            </Routes>
        </Router>
    );
}
