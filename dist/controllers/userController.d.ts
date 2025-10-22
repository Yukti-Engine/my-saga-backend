import type { Request, Response } from "express";
export declare const signupRequestOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signupVerifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signupResendOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const loginRequestOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const loginVerifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const loginResendOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=userController.d.ts.map