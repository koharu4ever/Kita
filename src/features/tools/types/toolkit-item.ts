export type ToolkitItem = {
  id: string;
  title: string;
  addedOn: string;
  summary: string;
  links: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};
