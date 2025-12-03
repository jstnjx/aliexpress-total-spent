(async function () {


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function detectCurrency(raw) {
        if (!raw) return "";

        const symbolMatch = raw.match(/[€$£¥₽₹]/);
        if (symbolMatch) {
            return symbolMatch[0];
        }

        const lettersOnly = raw.replace(/[^A-Za-z]/g, " ").trim();
        if (!lettersOnly) return "";

        const tokens = lettersOnly.split(/\s+/);
        const last = tokens[tokens.length - 1];

        if (last && last.length >= 2 && last.length <= 4) {
            return last.toUpperCase();
        }

        return "";
    }

    function parsePrice(text) {
        if (!text) return null;

        let raw = text.replace(/[^\d.,]/g, "").trim();
        if (!raw) return null;

        const hasDot = raw.includes(".");
        const hasComma = raw.includes(",");

        if (hasComma && hasDot) {
            const lastDot = raw.lastIndexOf(".");
            const lastComma = raw.lastIndexOf(",");
            if (lastComma > lastDot) {
                raw = raw.replace(/\./g, "").replace(",", ".");
            } else {
                raw = raw.replace(/,/g, "");
            }
        } else if (hasComma && !hasDot) {
            raw = raw.replace(",", ".");
        } else {
            raw = raw.replace(/,/g, "");
        }

        const num = parseFloat(raw);
        return Number.isFinite(num) ? num : null;
    }

    function getOrderYear(orderElem) {
        const dateDiv = orderElem.querySelector(".order-item-header-right-info div");
        if (!dateDiv) return "Unknown";
        const text = dateDiv.innerText || "";
        const match = text.match(/(\d{4})/);
        return match ? match[1] : "Unknown";
    }

    function getProductInfo(orderElem) {
        const link = orderElem.querySelector(".order-item-content-info-name a");
        if (!link) return { title: null, url: null };
        return {
            title: (link.innerText || "").trim(),
            url: link.href || null
        };
    }


    async function loadAllOrders() {
        let lastCount = 0;
        let stableCount = 0;

        while (true) {
            const button = document.querySelector(".order-more button");
            const visible = button && button.offsetParent !== null;
            const currentCount = document.querySelectorAll(".order-item").length;

            if (!button || !visible || button.disabled) break;

            if (currentCount === lastCount) {
                stableCount++;
                if (stableCount >= 3) break;
            } else {
                stableCount = 0;
                lastCount = currentCount;
            }

            button.click();
            await sleep(2000);
        }

        await sleep(1500);
    }


    function summarizeOrders() {
        const items = document.querySelectorAll(".order-item");
        const rows = [];
        const totalsPerYear = {};
        let grand = 0;
        let currency = "";

        items.forEach(orderElem => {
            const priceElem = orderElem.querySelector(".order-item-content-opt-price-total");
            if (!priceElem) return;

            const rawText = priceElem.innerText || priceElem.textContent || "";

            if (!currency) {
                currency = detectCurrency(rawText);
            }

            const amount = parsePrice(rawText);
            if (amount == null) return;

            const amountFixed = Number(amount.toFixed(2));
            const year = getOrderYear(orderElem);
            const product = getProductInfo(orderElem);

            totalsPerYear[year] = (totalsPerYear[year] || 0) + amountFixed;
            grand += amountFixed;

            rows.push({
                Year: year,
                Amount: amountFixed.toFixed(2),
                Currency: currency,
                "Product title": product.title,
                "Product URL": product.url
            });
        });

        const yearlyTable = Object.keys(totalsPerYear)
            .sort()
            .map(year => ({
                Year: year,
                "Total spent": totalsPerYear[year].toFixed(2),
                Currency: currency
            }));

        console.clear();
        console.log("=== Orders ===");
        console.table(rows);

        console.log("=== Total spent per year ===");
        console.table(yearlyTable);

        console.log("=== Total spent overall ===");
        console.log(grand.toFixed(2) + " " + currency);

        return {
            rows,
            yearlyTable,
            grandTotal: grand.toFixed(2),
            currency
        };
    }


    console.clear();
    await loadAllOrders();
    summarizeOrders();

})();
