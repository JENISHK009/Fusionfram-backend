function calculateBreakEvenPoint(
    fixedCosts,
    variableCostPerProduct,
    sellingPricePerProduct
) {
    // Contribution margin per product
    const contributionMargin = sellingPricePerProduct - variableCostPerProduct;

    // Break-even sales in units
    const breakEvenSales = fixedCosts / contributionMargin;

    return {
        contributionMargin: contributionMargin.toFixed(2),
        breakEvenSales: Math.ceil(breakEvenSales), // Always round up to whole units
    };
}

// Example Usage
const result = calculateBreakEvenPoint(5000, 20, 70.42);
console.log(result);
