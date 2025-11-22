import { Outlet } from "react-router";
import Nav from "../components/Nav";

function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="pt-[70px]">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;

