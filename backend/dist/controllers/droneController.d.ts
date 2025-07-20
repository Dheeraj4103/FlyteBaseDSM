import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllDrones: (req: Request, res: Response) => Promise<void>;
export declare const getDroneById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createDrone: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateDrone: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteDrone: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getDroneMissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=droneController.d.ts.map