export type ToolkitItem = {
  id: string;
  title: string;
  addedOn: string;
  createdAt: string;
  category: string;
  source: string;
  cover: string;
  summary: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};
