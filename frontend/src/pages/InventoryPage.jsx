import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Plus,
  Minus,
  Pencil,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  fetchProducts,
  adjustStock,
  updateProduct,
} from "../features/inventory/inventorySlice";
import ProductFormModal from "../components/ProductFormModal";
import Dropdown from "../components/Dropdown";
import useReadOnly from "../hooks/useReadOnly";

function stockBadge(product) {
  if (product.stock_quantity === 0) {
    return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }

  if (product.stock_quantity <= product.reorder_level) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
  }

  return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
}

function stockLabel(product) {
  if (product.stock_quantity === 0) return "Out of stock";
  if (product.stock_quantity <= product.reorder_level) return "Low stock";
  return "In stock";
}

export default function InventoryPage() {
  const dispatch = useDispatch();
  const { products, status } = useSelector((state) => state.inventory);
  const readOnly = useReadOnly();

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [modalProduct, setModalProduct] = useState(undefined); // undefined = closed, null = add, object = edit

  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");

  const productRowRefs = useRef({});
  const [highlightedProductId, setHighlightedProductId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchProducts({
          search,
          stockStatus: stockStatus === "all" ? undefined : stockStatus,
          category: category === "all" ? undefined : category,
          includeArchived,
        }),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, search, stockStatus, category, includeArchived]);

  // When a notification sends us to:
  // /inventory?productId=123
  // find that product, scroll to it, and highlight it.
  useEffect(() => {
    if (!productId || status !== "succeeded") return;

    const targetProductId = Number(productId);

    const targetProduct = products.find((p) => p.id === targetProductId);

    if (!targetProduct) return;

    const row = productRowRefs.current[targetProductId];

    if (!row) return;

    row.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedProductId(targetProductId);

    const timer = setTimeout(() => {
      setHighlightedProductId(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [productId, products, status]);

  // Real distinct categories derived from the products actually in the
  // database - not a static hardcoded dropdown.
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );

  return (
    <div className="space-y-5">
      <div className="dashboard-card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-50">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU"
              className="w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <Dropdown
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
            buttonClassName="text-sm py-2"
          />
          <Dropdown
            value={stockStatus}
            onChange={setStockStatus}
            options={[
              { value: "all", label: "Any stock level" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ]}
            buttonClassName="text-sm py-2"
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            Show archived
          </label>
          {!readOnly && (
            <button
              onClick={() => setModalProduct(null)}
              className="w-full sm:w-auto ml-auto flex items-center justify-center gap-1.5 bg-gradient-brand text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-glow"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 dark:text-slate-500 text-xs uppercase">
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 font-medium">Price</th>
                <th className="py-2 font-medium">Stock</th>
                <th className="py-2 font-medium pl-3">Status</th>
                {!readOnly && <th className="py-2 pr-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t border-black/5 dark:border-white/5 ${
                    !p.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="py-3 pr-4 min-w-45">
                    <div className="font-medium truncate max-w-45">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {p.sku}
                    </div>
                  </td>

                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {p.category}
                  </td>

                  <td className="py-3 pr-4 font-semibold whitespace-nowrap">
                    ${parseFloat(p.price).toFixed(2)}
                  </td>

                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      {!readOnly && <button
                        disabled={!p.is_active}
                        onClick={() =>
                          dispatch(
                            adjustStock({
                              id: p.id,
                              quantityChange: -1,
                            }),
                          )
                        }
                        className="w-6 h-6 shrink-0 rounded-md bg-brand-50 dark:bg-white/5 flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus size={12} />
                      </button>}

                      <span className="w-8 shrink-0 text-center font-medium">
                        {p.stock_quantity}
                      </span>

                      {!readOnly && <button
                        disabled={!p.is_active}
                        onClick={() =>
                          dispatch(
                            adjustStock({
                              id: p.id,
                              quantityChange: 1,
                            }),
                          )
                        }
                        className="w-6 h-6 shrink-0 rounded-md bg-brand-50 dark:bg-white/5 flex items-center justify-center disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>}
                    </div>
                  </td>

                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className={`stat-pill ${stockBadge(p)}`}>
                      {stockLabel(p)}
                    </span>
                  </td>

                  {!readOnly && <td className="py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModalProduct(p)}
                        className="w-8 h-8 shrink-0 rounded-lg bg-brand-50 dark:bg-white/5 text-brand-600 dark:text-brand-300 flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() =>
                          dispatch(
                            updateProduct({
                              id: p.id,
                              is_active: !p.is_active,
                            }),
                          )
                        }
                        className="w-8 h-8 shrink-0 rounded-lg bg-brand-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 flex items-center justify-center"
                        title={p.is_active ? "Archive" : "Restore"}
                      >
                        {p.is_active ? (
                          <Archive size={14} />
                        ) : (
                          <ArchiveRestore size={14} />
                        )}
                      </button>
 </div>
                  </td>}
                </tr>
              ))}

              {status === "succeeded" && products.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} className="py-10 text-center text-slate-400">
                    No products match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!readOnly && modalProduct !== undefined && (
        <ProductFormModal
          product={modalProduct}
          categories={categories}
          onClose={() => setModalProduct(undefined)}
        />
      )}
    </div>
  );
}
