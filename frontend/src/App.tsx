import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/Common/NavBar";
import Footer from "./components/Common/Footer";
import About from "./pages/About";
import BlogPost from "./pages/BlogPost";
import BlogPosts from "./pages/BlogPosts";
import ChangePassword from "./pages/ChangePassword";
import Home from "./pages/Home";
import LogIn from "./pages/Login";
import SignUp from "./pages/SignUp";
import UpdateMe from "./pages/UpdateMe";

function App() {
  return (
    <AuthProvider>
      <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/articles" element={<BlogPosts />} />
            <Route path="/articles/:url" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/me" element={<UpdateMe />} />
            <Route path="/me/password" element={<ChangePassword />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
