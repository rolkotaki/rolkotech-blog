import logo from "../../assets/images/logo.png";

function Logo() {
  return (
    <div className="flex items-center space-x-4">
      <img src={logo} alt="RolkoTech Logo" className="h-10 w-auto" />
    </div>
  );
}

export default Logo;
