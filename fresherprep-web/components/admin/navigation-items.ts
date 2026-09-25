import type { NavigationItem } from "@/components/shell";

export interface AdminNavigationItem extends NavigationItem {
  disabled?: boolean;
}

export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Knowledge", href: "/admin/knowledge" },
  { label: "Learning paths", href: "/admin/learning-paths" },
  { label: "Lessons", href: "/admin/lessons" },
  { label: "Questions", href: "/admin/questions" },
  { label: "Quizzes", href: "/admin/quizzes" },
  { label: "UI foundation", href: "/admin/ui-foundation" },
  { label: "Users", href: "/admin/users", disabled: true },
];
