import type { Request, Response } from "express";
export declare const getAdventures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const count: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPastAdventures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrganizerProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getOrganizerDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const currentMatchRequest: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const startAdventure: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=adventureController.d.ts.map