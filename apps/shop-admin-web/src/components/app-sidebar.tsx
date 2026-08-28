import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BookUserIcon,
  CreditCardIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MapPinIcon,
  SettingsIcon,
  ShelvingUnitIcon,
  ShieldIcon,
  ShoppingBasketIcon,
  ShoppingCartIcon,
  TabletSmartphoneIcon,
  UsersIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent } from "ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "ui/sidebar";
import { NavUser } from "./nav-user";

export const NAV_ITEMS = [
  {
    key: "home",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    to: "/app",
    children: undefined,
  },
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingCartIcon,
    to: "/app/orders",
    children: undefined,
  },
  {
    key: "carts",
    label: "Carts",
    icon: ShoppingBasketIcon,
    to: "/app/carts",
    children: undefined,
  },
  {
    key: "products",
    label: "Products",
    icon: LibraryIcon,
    to: "/app/products",
    children: [
      { label: "Categories", to: "/app/products/categories" },
      { label: "Brands", to: "/app/products/brands" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: ShelvingUnitIcon,
    to: "/app/inventory",
    children: undefined,
  },
  {
    key: "locations",
    label: "Locations",
    icon: MapPinIcon,
    to: "/app/locations",
    children: undefined,
  },
  {
    key: "pos-devices",
    label: "POS Devices",
    icon: TabletSmartphoneIcon,
    to: "/app/pos-devices",
    children: undefined,
  },
  {
    key: "customers",
    label: "Customers",
    icon: BookUserIcon,
    to: "/app/customers",
    children: undefined,
  },
  {
    key: "users",
    label: "Users",
    icon: UsersIcon,
    to: "/app/users",
    children: undefined,
  },
  {
    key: "roles",
    label: "Roles",
    icon: ShieldIcon,
    to: "/app/roles",
    children: undefined,
  },
  {
    key: "developers",
    label: "Developers",
    icon: KeyRoundIcon,
    to: "/app/developers",
    children: undefined,
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCardIcon,
    to: "/app/payments",
    children: undefined,
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    to: "/app/settings",
    children: undefined,
  },
] as const;

export function AppSidebar() {
  // only one collapsible nav item can be open at a time — its own link (or a
  // sub-item link) only ever opens it, any other top-level link closes it
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <span className="text-base font-semibold">Shop</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                if (item.children) {
                  const isActive =
                    pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <Collapsible
                      key={item.key}
                      open={openKey === item.key}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          render={
                            <Link
                              to={item.to}
                              onClick={() => setOpenKey(item.key)}
                            />
                          }
                          tooltip={item.label}
                          isActive={isActive}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.to}>
                              <SidebarMenuSubButton
                                render={<Link to={child.to} />}
                                isActive={pathname === child.to}
                              >
                                <span>{child.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={
                        <Link to={item.to} onClick={() => setOpenKey(null)} />
                      }
                      tooltip={item.label}
                      isActive={pathname === item.to}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
