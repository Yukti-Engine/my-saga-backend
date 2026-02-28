import type { Request, Response } from "express";
export declare const count: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export default function roomSocket(io: any, socket: any): void;
export declare function getUploadFileUrl(req: any, res: any): Promise<any>;
export declare function getDownloadFileUrl(req: any, res: any): Promise<any>;
//# sourceMappingURL=adventureController.d.ts.map