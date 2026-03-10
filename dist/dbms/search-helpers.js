export async function getAllCategories(pool) {
    const query = 'SELECT distinct category FROM categories';
    const result = await pool.query(query);
    console.log("Fetched categories:", result.rows);
    return result.rows;
}
export async function getAllSubcategories(category, pool) {
    const query = 'SELECT * FROM categories WHERE category = $1';
    const result = await pool.query(query, [category]);
    console.log("Fetched subcategories:", result.rows);
    return result.rows;
}
export async function getWord2s(id, pool) {
    const query = `SELECT word_2s from categories WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}
//# sourceMappingURL=search-helpers.js.map