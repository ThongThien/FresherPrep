import type { NavigationItem } from "@/components/shell";

export const adminNavigation: readonly NavigationItem[] = [
  { label: "Overview", href: "/admin" },
  { label: "Knowledge", href: "/admin/knowledge" },
  { label: "Learning paths", href: "/admin/learning-paths" },
  { label: "Lessons", href: "/admin/lessons" },
  { label: "Questions", href: "/admin/questions" },
  { label: "Quizzes", href: "/admin/quizzes" },
  { label: "Users", href: "/admin/users" },
];
