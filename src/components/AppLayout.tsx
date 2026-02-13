import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Brain,
  Wrench,
  BarChart3,
  Bell,
  LogOut,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analysis", label: "AI Analysis", icon: Brain },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/alerts", label: "Alerts", icon: Bell },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen page-gradient flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border sidebar-glow">
        <div className="p-6 flex items-center gap-2">
          <Sun className="w-7 h-7 text-primary" />
          <span className="text-xl font-display font-bold glow-text">SOLARA.AI</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-muted-foreground">Demo Mode</span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative",
                demoMode ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform",
                  demoMode ? "left-4.5" : "left-0.5"
                )}
              />
            </button>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-primary" />
          <span className="text-lg font-display font-bold glow-text">SOLARA.AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-lg pt-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <Button variant="ghost" className="w-full justify-start gap-3 mt-4 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-5 h-5" /> Logout
            </Button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:p-6 p-4 pt-16 lg:pt-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
