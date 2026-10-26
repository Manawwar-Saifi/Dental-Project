/**
 * Admin Layout Component
 *
 * Main layout wrapper for admin pages.
 * Combines:
 * - AdminHeader (top bar)
 * - AdminSidebar (navigation)
 * - Main content area (Outlet)
 *
 * Features:
 * - Responsive layout with MUI Grid
 * - Mobile sidebar toggle
 * - Proper spacing and structure
 *
 * Usage:
 * This component is used as a layout route in App.jsx
 * All admin pages are rendered inside the Outlet
 */
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import AdminHeader from "./AdminHeader";
import AdminSidebar, { DRAWER_WIDTH } from "./AdminSidebar";

const AdminLayout = () => {
  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Toggle mobile sidebar
   */
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Close mobile sidebar
   */
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <Box className="flex min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader onMenuClick={handleSidebarToggle} />

      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Allow this flex child to be narrower than its content so wide tables
          // overflow their own scroll container (which scrolls horizontally)
          // instead of stretching the page past the viewport and being clipped
          // by body { overflow-x: hidden }.
          minWidth: 0,
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          // Mirrors the html { scrollbar-gutter: stable } in index.css. If the
          // browser ever treats this flex container as the effective layout root
          // instead of <html>, the gutter is still reserved and content won't shift
          // when the page scrollbar appears or disappears.
          scrollbarGutter: "stable",
        }}
        className="bg-gray-50"
      >
        {/* Toolbar spacer to push content below fixed header */}
        <Toolbar />

        {/* Page Content */}
        <Box className="p-4 md:p-6">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
