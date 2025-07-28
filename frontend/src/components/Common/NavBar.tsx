import { useState } from "react";
import { useScrollNavbar } from "../../hooks/useScrollNavbar";
import AuthLinks from "./AuthLinks";
import DesktopNav from "./DesktopNav";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import MobileMenuButton from "./MobileMenuButton";

function NavBar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const isNavbarHidden = useScrollNavbar();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header
      className={`bg-white shadow fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isNavbarHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between relative">
        {/* Left: Logo */}
        <Logo />
        {/* Center: Nav links (desktop only) */}
        <DesktopNav />
        {/* Right: Auth links (desktop only) */}
        <AuthLinks />
        {/* Hamburger (mobile only) */}
        <MobileMenuButton
          isOpen={isMobileMenuOpen}
          toggleMenu={toggleMobileMenu}
        />
      </div>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} />
    </header>
  );
}

export default NavBar;
