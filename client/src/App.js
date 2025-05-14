// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Layout components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Page components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import SearchPage from "./pages/SearchPage";
import GroupsList from "./pages/GroupsList";
import GroupDetail from "./pages/GroupDetail";
import CreateGroup from "./pages/CreateGroup";
import ChatPage from "./pages/ChatPage";
import FriendRequestsPage from "./pages/FriendRequestsPage";
import Statistics from "./pages/Statistics";
import MediaPage from "./pages/MediaPage";
import NotFound from "./pages/NotFound";

// Protected route component
import ProtectedRoute from "./components/auth/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="app">
            <Navbar />
            <div className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile/:id"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit"
                  element={
                    <ProtectedRoute>
                      <EditProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <GroupsList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <ProtectedRoute>
                      <GroupDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-group"
                  element={
                    <ProtectedRoute>
                      <CreateGroup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:userId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/friend-requests"
                  element={
                    <ProtectedRoute>
                      <FriendRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <ProtectedRoute>
                      <Statistics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/media"
                  element={
                    <ProtectedRoute>
                      <MediaPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
