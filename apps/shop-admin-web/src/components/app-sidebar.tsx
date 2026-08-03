import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BookUserIcon,
  LibraryIcon,
  MapPinIcon,
  ShelvingUnitIcon,
  ShoppingCartIcon,
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

const NAV_ITEMS = [
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingCartIcon,
    to: "/app/orders",
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
    key: "customers",
    label: "Customers",
    icon: BookUserIcon,
    to: "/app/customers",
    children: undefined,
  },
  {
    key: "users",
    label: "Staff",
    icon: UsersIcon,
    to: "/app/users",
    children: undefined,
  },
] as const;

export function AppSidebar() {
  // only one collapsible nav item can be open at a time — its own link (or a
  // sub-item link) only ever opens it, any other top-level link closes it
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="#">
                <span className="text-base font-semibold">Shop</span>
              </a>
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
                        <Link to={item.to} onClick={() => setOpenKey(item.key)}>
                          <SidebarMenuButton
                            tooltip={item.label}
                            isActive={isActive}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </Link>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <Link key={child.to} to={child.to}>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton
                                    isActive={pathname === child.to}
                                  >
                                    <span>{child.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </Link>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    onClick={() => setOpenKey(null)}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip={item.label}
                        isActive={pathname === item.to}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </Link>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
