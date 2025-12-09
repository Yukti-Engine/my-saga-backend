export async function getAllOffers(pool) {
    const query = 'SELECT * FROM offers';
    const result = await pool.query(query);
    console.log("All Offers:", result.rows);
    return result.rows;
}
//# sourceMappingURL=offer-helpers.js.map