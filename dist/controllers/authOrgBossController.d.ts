import type { Request, Response } from "express";
export declare const organiserSignup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bossSignup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const organiserLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bossLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveOrganiser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveBoss: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authOrgBossController.d.ts.map