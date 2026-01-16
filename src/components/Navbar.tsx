'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Wallet, FileText, BarChart3, LogOut, Database, ChevronDown, Building2, FileCode, Bell, Settings, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/budget', label: 'Anggaran', icon: FileText },
    { href: '/dashboard/transaction', label: 'Pencatatan', icon: Wallet },
    { href: '/dashboard/report', label: 'Laporan', icon: BarChart3 },
  ]

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex justify-between items-center h-14 border-b">
          <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2 text-green-600">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
              <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
              <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
              <div className="w-2 h-2 bg-green-600 rounded-sm"></div>
            </div>
            KKA
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 h-12">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname.startsWith('/dashboard/master')
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}>
                <Database className="h-4 w-4" />
                Master Data
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/master/gl-account" className="flex items-center gap-2 cursor-pointer">
                  <FileCode className="h-4 w-4" />
                  GL Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/master/regional" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Regional
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/master/vendor" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  Vendor
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
