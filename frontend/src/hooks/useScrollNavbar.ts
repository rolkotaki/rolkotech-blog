import { useState, useEffect } from "react";

export function useScrollNavbar() {
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [lastScrollTop, setLastScrollTop] = useState<number>(0);

  useEffect(() => {
    const handleScroll: EventListener = () => {
      const currentScroll: number =
        window.pageYOffset || document.documentElement.scrollTop;

      // At the top of the page, always show the navbar
      if (currentScroll <= 0) {
        setIsHidden(false);
        return;
      }
      // Scrolling down
      if (currentScroll > lastScrollTop + 50) {
        setIsHidden(true);
        setLastScrollTop(currentScroll);
      }
      // Scrolling up
      else if (currentScroll < lastScrollTop - 50) {
        setIsHidden(false);
        setLastScrollTop(currentScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollTop]);

  return isHidden;
}
