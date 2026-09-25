export type SharedDocument = {
  id: string;
  name: string;
  caseId: string;
  sharedAt: string;
  sizeKb: number;
};
export type PortalMessage = {
  id: string;
  from: "cliente" | "escritorio";
  author: string;
  at: string;
  body: string;
};
