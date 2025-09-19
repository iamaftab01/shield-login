import { Request, Response } from 'express';
import * as authService from '../services/authService';

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    res.json({ message: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    console.log(ip);
    const result = await authService.login(email, password, ip);
    res.json({ message: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
