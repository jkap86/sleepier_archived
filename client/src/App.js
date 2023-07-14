import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './components/Home/homepage';
import Main from './components/Home/main';
import MainROF from './components/ROF/mainROF';
import PickTracker from './components/Leagues/picktracker';
import Players from './components/Players/players';
import Leagues from './components/Leagues/leagues';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/:username' element={<Main />} />
          <Route path='/pools/rof' element={<MainROF />} />
          <Route path='/picktracker/:league_id' element={<PickTracker />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
