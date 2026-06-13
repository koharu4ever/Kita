export type ToolkitItem = {
  id: string;
  title: string;
  postedOn: string;
  summary: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};
