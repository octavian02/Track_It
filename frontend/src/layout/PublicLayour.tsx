import React from "react";
import { Outlet } from "react-router-dom";

const PublicLayout: React.FC = () => (
  <div className="public-wrapper">
    <Outlet />
  </div>
);

export default PublicLayout;
