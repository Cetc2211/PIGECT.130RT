

'use client';

import {
  BookCopy,
  LayoutDashboard,
  Settings,
  Users,
  Presentation,
  Contact,
  BarChart3,
  FileText,
  CalendarCheck,
  Package,
  BookText,
  PenSquare,
  FilePen,
  ClipboardCheck,
  User as UserIcon,
  ChevronRight,
  Loader2,
  LogOut,
  AlertTriangle,
  ClipboardSignature,
  Shield,
  Megaphone,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { LOCAL_ADMIN_EMAIL } from '@/lib/local-access';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/announcements', icon: Megaphone, label: 'Sala de Anuncios' },
  { href: '/tutor', icon: GraduationCap, label: 'Tutoría' },
  { href: '/groups', icon: BookCopy, label: 'Grupos' },
  { href: '/bitacora', icon: BookText, label: 'Bitácora' },
  { href: '/grades', icon: FilePen, label: 'Calificaciones' },
  { href: '/attendance', icon: CalendarCheck, label: 'Asistencia' },
  { href: '/participations', icon: PenSquare, label: 'Participaciones' },
  { href: '/activities', icon: ClipboardCheck, label: 'Actividades' },
  { href: '/semester-evaluation', icon: Presentation, label: 'Eva. Semestral' },
  { href: '/records', icon: ClipboardSignature, label: 'Actas' },
  { href: '/reports', icon: FileText, label: 'Informes' },
  { href: '/admin/absences', icon: Users, label: 'Seguimiento' },
  { href: '/statistics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/contact', icon: Contact, label: 'Contacto y Soporte' },
];

const defaultSettings = {
    institutionName: "Academic Tracker",
    logo: "",
    theme: "theme-mint",
    teacherPhoto: "",
};

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  // 100% local mode — no Firebase auth
  const user = { uid: 'local-user', email: LOCAL_ADMIN_EMAIL, photoURL: '' };
  const isAuthLoading = false;
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const { officialGroups, settings, syncStatus, activeGroup, activePartialId, isLoading: isDataLoading, unreadAnnouncementsCount } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const [isTrackingManager, setIsTrackingManager] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const effectiveEmail = user?.email || LOCAL_ADMIN_EMAIL;
  const effectivePhoto = settings.teacherPhoto || user?.photoURL || '';

  useEffect(() => {
    // Local mode — all roles enabled
    setIsTrackingManager(true);
    setIsTutor(true);
  }, []);

  const filteredNavItems = navItems.filter(item => {
    // Seguimiento visible para todos (docentes ven sus reportes, encargados ven todo)
    if (item.label === 'Seguimiento') {
        return true; 
    }
    if (item.label === 'Tutoría') {
        return isTutor;
    }
    return true;
  });


  useEffect(() => {
    // Local mode — redirect login/signup to dashboard
    if (pathname === '/login' || pathname === '/signup') {
      router.replace('/dashboard');
    }
  }, [router, pathname]);

  useEffect(() => {
    const theme = settings?.theme || defaultSettings.theme;
    document.body.className = theme;
  }, [settings?.theme]);
  
  if (isDataLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>Cargando datos...</span>
        </div>
    );
  }

  // Para las rutas de login/signup, no se muestra el layout principal
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }


  const handleSignOut = async () => {
    router.push('/login');
  };

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <AppLogo name={settings.institutionName} logoUrl={settings.logo} />
            <div className="px-4 py-2 flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                syncStatus === 'synced' ? "bg-green-500" : 
                syncStatus === 'pending' ? "bg-red-500 animate-pulse" : 
                "bg-yellow-500 animate-pulse"
              )} />
              <span className="text-xs text-sidebar-foreground/70">
                {syncStatus === 'synced' ? 'Sincronizado' : 
                 syncStatus === 'pending' ? 'Pendiente' : 
                 'Sincronizando'}
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {activeGroup ? (
                  <>
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-sidebar-foreground/70 tracking-wider uppercase">Grupo Activo</p>
                         <Button asChild variant="ghost" className={cn("h-auto w-full justify-start p-2 mt-1 text-wrap text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                          <Link href={`/groups/${activeGroup.id}`}>
                            <div className='space-y-1 w-full'>
                              <p className="font-bold flex items-center gap-2">
                                <Package className="h-4 w-4"/>
                                {activeGroup.subject}
                              </p>
                              <p className="font-semibold flex items-center gap-2 text-sm pl-1">
                                <BookText className="h-4 w-4"/>
                                {getPartialLabel(activePartialId)}
                                <ChevronRight className="h-4 w-4 ml-auto"/>
                              </p>
                            </div>
                          </Link>
                        </Button>
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : isDataLoading ? (
                  <>
                    <div className="px-4 py-2">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Separator className="my-2" />
                  </>
              ) : null
            }
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href} className="relative flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.label}</span>
                      </div>
                      {item.href === '/announcements' && unreadAnnouncementsCount > 0 && (
                        <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse lg:mr-2" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="flex-col !items-start gap-4">
            <div className="w-full px-4 mt-auto mb-4">
                 <p className="font-dancing text-2xl text-sidebar-foreground/60 text-engraved text-center">
                    By Cetc
                 </p>
            </div>
            <Separator className="mx-0" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                  <Link href="/settings">
                    <Settings />
                    <span>Ajustes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin') && !pathname.startsWith('/admin/absences')}>
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={effectivePhoto} alt="Avatar" />
                    <AvatarFallback>{effectiveEmail[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {effectiveEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
