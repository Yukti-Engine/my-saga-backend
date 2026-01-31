import type { Request, Response } from "express";
export declare const updateUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const joinAdventure: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const currentMatchRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map