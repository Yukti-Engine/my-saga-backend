import type { Request, Response } from "express";
export declare const getAdventures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveAdventureEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const organizeEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPastAdventures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrganizerProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getOrganizerDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestMatch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const currentLobby: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const startAdventure: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const send: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const count: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const receive: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=organizerController.d.ts.map