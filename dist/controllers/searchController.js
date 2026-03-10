import pool from "../dbms/db.js";
import { getAllCategories, getAllSubcategories } from "../dbms/search-helpers.js"; // Ensure this file exports updateUser correctly
export const getCategories = async (req, res) => {
    return res.json(await getAllCategories(pool));
};
export const getSubcategories = async (req, res) => {
    const category = req.body.category;
    return res.json(await getAllSubcategories(category, pool));
};
//# sourceMappingURL=searchController.js.map