declare module '@prisma/orm-postgres/runtime' {
  export default function postgres<TContract = any>(options: {
    url?: string;
    contractJson: any;
    middleware?: any[];
  }): any;
}
