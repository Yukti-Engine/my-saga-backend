import type { Request, Response } from "express";
export declare const getCategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubcategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | {
    username: any;
    dob: any;
    gender: any;
    setting_1: any;
    setting_2: any;
    icon: any;
    bio: any;
}>;
//# sourceMappingURL=searchController.d.ts.map