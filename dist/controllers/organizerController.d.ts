import type { Request, Response } from "express";
export declare const updateOrganizerProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getOrganizerDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const currentMatchRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=organizerController.d.ts.map