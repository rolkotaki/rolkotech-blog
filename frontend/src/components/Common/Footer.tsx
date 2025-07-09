function Footer() {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-3 text-center text-sm text-gray-500">
      <div className="container mx-auto px-4">
        &copy; RolkoTech <span>{currentYear}</span>. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
