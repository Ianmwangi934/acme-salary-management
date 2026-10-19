
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>ACME HR</h2>

      <nav>
        <NavLink to="/" end>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/employees">
          <Users size={18} />
          Employees
        </NavLink>

        <NavLink to="/compensation">
          <Wallet size={18} />
          Compensation
        </NavLink>
      </nav>
    </aside>
  );
}
