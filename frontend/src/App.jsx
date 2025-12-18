import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./Pages/Home/Home";
import About from "./components/About";
import Qualities from "./components/Qualities";
import Menu from "./components/Menu";
import WhoAreWe from "./components/WhoAreWe";
import Team from "./components/Team";
import Reservation from "./components/Reservation";
import Success from "./Pages/Success/Success";
import NotFound from "./Pages/NotFound/NotFound";
import OrderCart from "./components/OrderCart";

import './assets/css/styles.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/success" element={<Success />} />
        <Route path="/about" element={<About />} />
        <Route path="/qualities" element={<Qualities />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/order" element={<OrderCart />} />
        <Route path="/whoarewe" element={<WhoAreWe />} />
        <Route path="/team" element={<Team />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <Toaster />
    </Router>
  );
};

export default App;
