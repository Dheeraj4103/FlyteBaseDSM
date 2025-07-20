import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllSites: (req: Request, res: Response) => Promise<void>;
export declare const getSiteById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createSite: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateSite: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSite: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSiteMissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSiteDrones: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=siteController.d.ts.map