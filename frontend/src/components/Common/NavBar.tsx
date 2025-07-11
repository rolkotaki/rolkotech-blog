import { useState } from "react";
import AuthLinks from "./AuthLinks";
import DesktopNav from "./DesktopNav";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import MobileMenuButton from "./MobileMenuButton";

function NavBar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow">
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

      {/* Mobile menu (stacked layout) */}
      <MobileMenu isOpen={isMobileMenuOpen} />
    </header>
  );
}

export default NavBar;
