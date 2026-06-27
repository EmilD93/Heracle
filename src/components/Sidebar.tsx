import {
  LayoutDashboard,
  Ticket,
  CalendarDays,
  Settings,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { cn } from '../utils/cn'

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'my-events',
    label: 'My Events',
    icon: Ticket,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarDays,
  },
  {
    id: 'organizer',
    label: 'Organizer',
    icon: Briefcase,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
]

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  userName: string
  userRole: 'student' | 'organizer'
  onLogout: () => void
}

export function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, userName, userRole, onLogout }: SidebarProps) {
  return (
    <aside 
      className={cn(
        "bg-white rounded-[2.5rem] shadow-sm border border-slate-100/50 flex flex-col p-6 h-full transition-all duration-500 ease-in-out relative shrink-0 overflow-visible",
        isCollapsed ? "w-24 px-4 items-center" : "w-72 items-stretch"
      )}
    >
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none rounded-t-[2.5rem]" />

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 z-50 cursor-pointer outline-none focus:outline-none"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft 
          size={18} 
          strokeWidth={2.5} 
          className={cn("transition-transform duration-500 ease-in-out", isCollapsed && "rotate-180")} 
        />
      </button>

      <div className={cn("relative z-10 flex items-center mb-12 mt-2 w-full transition-all duration-500 ease-in-out", isCollapsed ? "justify-center gap-0" : "justify-start gap-4 px-2")}>
        <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
          <GraduationCap size={26} strokeWidth={2.5} />
        </div>
        <span className={cn(
          "font-extrabold text-2xl text-slate-800 tracking-tight transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap block",
          isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[200px]"
        )}>
          Heracle
        </span>
      </div>

      <nav className="relative z-10 flex-1 space-y-2.5 w-full flex flex-col items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center rounded-[1.25rem] transition-all duration-500 ease-in-out font-semibold text-[15px] whitespace-nowrap cursor-pointer h-14 w-full outline-none focus:outline-none',
                isCollapsed 
                  ? "justify-center px-0 bg-transparent shadow-none" 
                  : "gap-4 px-5",
                isActive && !isCollapsed
                  ? 'bg-blue-50/80 text-blue-600 shadow-sm'
                  : !isActive ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-700' : 'text-blue-600',
              )}
            >
              <div className={cn(
                "w-12 h-12 flex items-center justify-center shrink-0 transition-all duration-500 rounded-[1.25rem]",
                isCollapsed && isActive && "bg-blue-50/80 shadow-sm border border-blue-100/10",
                isCollapsed && !isActive && "hover:bg-slate-50"
              )}>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    'transition-transform duration-300',
                    isActive && 'scale-110',
                  )}
                />
              </div>
              
              <span className={cn(
                "transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap block text-left",
                isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[200px]"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className={cn(
        "relative z-10 mt-auto rounded-[1.5rem] transition-all duration-500 ease-in-out w-full flex flex-col items-center gap-2",
        isCollapsed 
          ? "p-0 bg-transparent border-transparent" 
          : "bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 border border-slate-100/80"
      )}>
        <div className={cn("flex items-center transition-all duration-500 ease-in-out w-full", isCollapsed ? "justify-center gap-0" : "justify-start gap-3.5")}>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className={cn(
            "flex flex-col text-left transition-all duration-500 ease-in-out overflow-hidden flex-1 min-w-0",
            isCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-[200px]"
          )}>
            <span className="text-sm font-bold text-slate-800 whitespace-nowrap truncate">
              {userName}
            </span>
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap capitalize">
              {userRole}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className={cn(
              "shrink-0 w-9 h-9 rounded-[0.75rem] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer outline-none focus:outline-none",
              isCollapsed ? "hidden" : ""
            )}
          >
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>
        {isCollapsed && (
          <button
            onClick={onLogout}
            title="Sign out"
            className="w-10 h-10 rounded-[0.75rem] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer outline-none focus:outline-none"
          >
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </aside>
  )
}