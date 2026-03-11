import pool from "../dbms/db.js";
import { getAllCategories, getAllSubcategories } from "../dbms/search-helpers.js"; // Ensure this file exports updateUser correctly
import { getOrganizer } from "../dbms/organizer-helpers.js";
import { getBoss } from "../dbms/boss-helpers.js";
import { getUser } from "../dbms/user-helpers.js";
export const getCategories = async (req, res) => {
    const { id, role, accessToken } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken)
            return res.json(await getAllCategories(pool));
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const getSubcategories = async (req, res) => {
    const { category, id, role, accessToken } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken)
            return res.json(await getAllSubcategories(category, pool));
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
//# sourceMappingURL=searchController.js.map