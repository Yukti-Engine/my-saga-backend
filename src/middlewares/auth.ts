import type { Request, Response, NextFunction } from "express";
import pool from "../db.js";

export const authUser = async (req: Request, res: Response, next: NextFunction) => {
  const { uid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [uid, "user", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

export const authBoss = async (req: Request, res: Response, next: NextFunction) => {
  const { bid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [bid, "boss", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

export const authOrganizer = async (req: Request, res: Response, next: NextFunction) => {
  const { oid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [oid, "organizer", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

export const authSuperToken = (req: Request, res: Response, next: NextFunction) => {
  const { superToken } = req.body;
  if (!superToken || superToken !== process.env.SUPER_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

export const authAny = async (req: Request, res: Response, next: NextFunction) => {
  const { id, role, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [id, role, accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};
