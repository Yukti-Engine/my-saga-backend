import type { Request, Response } from "express";
export declare const updateBossProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBossDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const findAdventures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const joinAdventure: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const currentMatchRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=bossController.d.ts.map