interface MobileMenuButtonProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

function MobileMenuButton({ isOpen, toggleMenu }: MobileMenuButtonProps) {
  return (
    <div className="md:hidden">
      <button onClick={toggleMenu} className="focus:outline-none">
        <svg
          className="w-6 h-6 text-blue-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            className={isOpen ? "hidden" : ""}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path
            className={!isOpen ? "hidden" : ""}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default MobileMenuButton;
