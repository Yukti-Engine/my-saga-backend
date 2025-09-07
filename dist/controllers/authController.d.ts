import type { Request, Response } from "express";
export declare const requestOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyOtp: (req: Request, res: Response) => Response<any, Record<string, any>>;
export declare const resendOtp: (req: Request, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=authController.d.ts.map