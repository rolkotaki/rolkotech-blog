import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/Nav/NavBar";
import Footer from "./components/Common/Footer";
import About from "./pages/About";
import Admin from "./pages/Admin";
import BlogPost from "./pages/BlogPost";
import BlogPosts from "./pages/BlogPosts";
import ChangePassword from "./pages/ChangePassword";
import EditBlogPost from "./pages/EditBlogPost";
import Home from "./pages/Home";
import LogIn from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import SignUp from "./pages/SignUp";
import UpdateMe from "./pages/UpdateMe";

function App() {
  return (
    <AuthProvider>
      <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1 flex flex-col pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/articles" element={<BlogPosts />} />
            <Route path="/articles/:url" element={<BlogPost />} />
            <Route path="/articles/:url/edit" element={<EditBlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/me" element={<UpdateMe />} />
            <Route path="/me/password" element={<ChangePassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
