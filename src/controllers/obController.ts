import type { Request, Response } from "express";
import pool from "../db.js";
import { buildIssuerDocument, ISSUER_URL, BADGE_ICON_BUCKET } from "../services/openBadgesService.js";

export const getIssuer = (_req: Request, res: Response) => {
  return res.json(buildIssuerDocument());
};

export const getBadgeClass = async (req: Request, res: Response) => {
  const badgeId = parseInt(req.params.badgeId as string, 10);
  if (!Number.isInteger(badgeId) || badgeId <= 0)
    return res.status(400).json({ error: "Invalid badgeId" });

  const { rows } = await pool.query(
    `SELECT * FROM get_badge_with_league($1::int)`,
    [badgeId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });

  const badge = rows[0];
  return res.json({
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: `https://api.mysaga.in/ob/badges/${badge.id}`,
    type: "Achievement",
    name: badge.title,
    description: badge.description || "My Saga badge achievement.",
    image: { id: `${BADGE_ICON_BUCKET}/${badge.id}`, type: "Image" },
    issuer: { id: ISSUER_URL, type: "Profile" },
    criteria: {
      narrative: "Awarded by an Expert upon successful Adventure assessment.",
    },
  });
};

export const getAssertion = async (req: Request, res: Response) => {
  const assertionId = req.params.assertionId;
  if (!assertionId) return res.status(400).json({ error: "Missing assertionId" });

  const { rows } = await pool.query(
    `SELECT * FROM get_ob_assertion($1::uuid)`,
    [assertionId]
  );
  if (rows.length === 0 || rows[0].revoked)
    return res.status(404).json({ error: "Not found or revoked" });

  return res.json(rows[0].credential_json);
};
