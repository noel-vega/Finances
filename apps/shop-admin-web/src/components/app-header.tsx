import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { SidebarTrigger } from "ui/sidebar";
import { Separator } from "ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "ui/breadcrumb";

export function AppHeader() {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => match.staticData.breadcrumb)
    .map((match) => ({
      pathname: match.pathname,
      label:
        typeof match.staticData.breadcrumb === "function"
          ? match.staticData.breadcrumb(match.params)
          : match.staticData.breadcrumb!,
    }));

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        {crumbs.length > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, index) => (
                  <Fragment key={crumb.pathname}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === crumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link to={crumb.pathname} />}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>
    </header>
  );
}
