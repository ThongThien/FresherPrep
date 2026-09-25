export interface NavigationItem {
  label: string;
  href: string;
}

export const learningNavigation: readonly NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Learning paths", href: "/learning-paths" },
  { label: "Quizzes", href: "/quizzes" },
  { label: "Learning Games", href: "/games" },
  { label: "Progress", href: "/progress" },
];

export const adminNavigationEntry: NavigationItem = {
  label: "Admin",
  href: "/admin",
};

export function isNavigationItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
