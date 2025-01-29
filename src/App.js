import React from "react";
import { Routes, Route } from 'react-router-dom';
import Core from "./Core";
import ForgotPassword from './components/forgotpw.component';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/*" element={<Core />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </div>
  );
}

export default App;
