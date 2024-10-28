import React from "react";
import { BrowserRouter as Router } from 'react-router-dom';
import Core from "./Core";

function App() {
  return (
    <Router>
      <div className="App">
        <Core />
      </div>
    </Router>
  );
}

export default App;
