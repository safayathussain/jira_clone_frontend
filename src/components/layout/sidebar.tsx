"use client";

import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight, LogOut, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, logout } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 68 }}
      className="flex h-full flex-col border-r bg-card/80 backdrop-blur-xl z-20 relative shrink-0"
    >
      <div className="flex h-14 items-center px-4 border-b">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase size={18} />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg"
              >
                Jira Clone
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-2 border-t">
        <Button 
          variant="ghost" 
          className="w-full flex justify-start gap-3 px-3" 
          onClick={handleLogout}
        >
          <LogOut size={20} className="shrink-0 text-destructive" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-destructive font-medium truncate"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-20 h-8 w-8 rounded-full border bg-background shadow-md hidden md:flex"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </Button>
    </motion.div>
  );
}
