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
//# sourceMappingURL=category-helpers.js.map