function calculateBestSellingPrice(
    returnRatio,
    ordersPerDay,
    dayCount,
    perReturnCharge,
    shippingPackagingCostPerProduct,
    pricePerProduct,
    platformCommissionRate,
    monthlyFixedCost
) {
    const totalOrders = ordersPerDay * dayCount;

    // Delivered and returned orders
    const deliveredProducts = totalOrders * (1 - returnRatio / 100);
    const returnedOrders = totalOrders * (returnRatio / 100);

    // Costs
    const totalShippingPackagingCost = totalOrders * shippingPackagingCostPerProduct;
    const totalReturnCost = returnedOrders * perReturnCharge;
    const totalProductCost = totalOrders * pricePerProduct;

    // Total initial spent (without platform fees)
    const totalSpentWithoutPlatformFee = totalProductCost + totalReturnCost + totalShippingPackagingCost;

    // Minimum price per delivered product
    const minimumPriceWithoutFee = totalSpentWithoutPlatformFee / deliveredProducts;

    // Platform fee per product
    const platformFee = minimumPriceWithoutFee * (platformCommissionRate / 100);

    // Total platform fee for all delivered products
    const totalPlatformFee = platformFee * deliveredProducts;

    // Final total spent (including platform fees and fixed costs)
    const totalSpent = totalSpentWithoutPlatformFee + totalPlatformFee + monthlyFixedCost;

    // Distribute monthly fixed costs across delivered products
    const fixedCostPerProduct = monthlyFixedCost / deliveredProducts;

    // Final best selling price per product
    const bestSellingPrice = totalSpent / deliveredProducts;

    return {
        totalOrders,
        deliveredProducts: deliveredProducts.toFixed(2),
        returnedOrders: returnedOrders.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        minimumPriceWithoutFee: minimumPriceWithoutFee.toFixed(2),
        totalPlatformFee: totalPlatformFee.toFixed(2),
        fixedCostPerProduct: fixedCostPerProduct.toFixed(2),
        bestSellingPrice: bestSellingPrice.toFixed(2),
    };
}

// Example Usage
const result = calculateBestSellingPrice(20, 100, 15, 150, 5, 20, 0, 2000);
console.log(result);


