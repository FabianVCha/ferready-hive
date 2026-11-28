const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function isDemoEnabled(value) {
  return value === "1";
}

export function searchProducts(products, query) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    const searchable = normalize([
      product.name, product.brand, product.category, product.description,
      product.reference, product.model, product.cardTitle, ...(product.searchAliases ?? []),
    ].join(" "));
    return words.every((word) => searchable.includes(word));
  });
}

export function updateCart(cart, slug, quantity, products) {
  if (
    !products.some((p) => p.slug === slug) ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 20
  )
    return cart;
  const next = cart.filter((item) => item.slug !== slug);
  if (quantity > 0) next.push({ slug, quantity });
  return next;
}

export function restoreCart(raw, products) {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce((cart, item) => {
      if (!item || typeof item !== "object") return cart;
      return updateCart(cart, item.slug, item.quantity, products);
    }, []);
  } catch {
    return [];
  }
}

export function cartTotal(cart, products) {
  return cart.reduce((total, item) => {
    const product = products.find((p) => p.slug === item.slug);
    return (
      total +
      (product &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 20
        ? product.price * item.quantity
        : 0)
    );
  }, 0);
}
