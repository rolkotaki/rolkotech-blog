interface PasswordToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
}

function PasswordToggleButton({
  isVisible,
  onToggle,
}: PasswordToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-600 focus:outline-none"
    >
      {/* Eye Icon (visible when password is hidden) */}
      {!isVisible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ) : (
        /* Eye-Off Icon (visible when password is shown) */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.94 17.94A9.956 9.956 0 0112 19c-4.48 0-8.27-2.94-9.54-7a9.954 9.954 0 012.39-3.6M9.88 9.88a3 3 0 004.24 4.24M14.12 14.12a3 3 0 00-4.24-4.24"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 5c4.48 0 8.27 2.94 9.54 7-.44 1.4-1.16 2.68-2.1 3.76"
          />
        </svg>
      )}
    </button>
  );
}

export default PasswordToggleButton;
