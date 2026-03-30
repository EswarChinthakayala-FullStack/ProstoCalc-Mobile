import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isPatientMobileOpen, setPatientMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const openMobileSidebar = () => setMobileOpen(true);
  const closeMobileSidebar = () => setMobileOpen(false);
  
  const openPatientMobileSidebar = () => setPatientMobileOpen(true);
  const closePatientMobileSidebar = () => setPatientMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      toggleSidebar, 
      isMobileOpen, 
      setMobileOpen, 
      openMobileSidebar, 
      closeMobileSidebar,
      isPatientMobileOpen,
      openPatientMobileSidebar,
      closePatientMobileSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
