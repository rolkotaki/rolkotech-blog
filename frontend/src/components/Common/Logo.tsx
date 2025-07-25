import logo from "../../assets/images/logo.jpg";

function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <img src={logo} alt="RolkoTech Logo" className="h-10 w-auto" />
      <span className="text-xl font-bold text-blue-700">RolkoTech</span>
    </div>
  );
}

export default Logo;
