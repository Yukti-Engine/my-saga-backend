import pool from "../dbms/db.js";
import { getAllOffers } from "../dbms/offer-helpers.js"; // Ensure this file exports updateUser correctly
export const getOffers = async (req, res) => {
    return res.json(await getAllOffers(pool));
};
//# sourceMappingURL=shopController.js.map