import { Link } from "@tanstack/react-router";
import { BookUserIcon, LibraryIcon, ShelvingUnitIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";
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
} from "ui/sidebar";

export function AppSidebar() {
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
              <Link to="/app/orders">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Roles">
                    <ShoppingCartIcon />
                    <span>Orders</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>

              <Link to="/app/products">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Products">
                    <LibraryIcon />
                    <span>Products</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>

              <Link to="/app/customers">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Customers">
                    <BookUserIcon />
                    <span>Customers</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>

              <Link to="/app/inventory">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Users">
                    <ShelvingUnitIcon />
                    <span>Inventory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>



              <Link to="/app/users">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Users">
                    <UsersIcon />
                    <span>Staff</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>


            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
