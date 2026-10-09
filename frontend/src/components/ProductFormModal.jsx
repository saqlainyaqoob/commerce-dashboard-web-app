
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import Dropdown from "./Dropdown";
import {
  createProduct,
  updateProduct,
  resetSaveStatus,
} from "../features/inventory/inventorySlice";

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  price: "",
  stock_quantity: "",
  reorder_level: "",
};

export default function ProductFormModal({
  product,
  categories,
  onClose,
  readOnly = false,
}) {
  const dispatch = useDispatch();
  const { saveStatus, saveError } = useSelector(
    (state) => state.inventory
  );

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock_quantity: product.stock_quantity,
        reorder_level: product.reorder_level,
      });
    } else {
      setForm(EMPTY);
    }

    dispatch(resetSaveStatus());
  }, [product, dispatch]);

  useEffect(() => {
    if (saveStatus === "succeeded") {
      onClose();
    }
  }, [saveStatus, onClose]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Prevent read-only users from creating or updating products.
    if (readOnly) return;

    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: parseFloat(form.price),
      ...(product
        ? {
            reorder_level:
              form.reorder_level === ""
                ? undefined
                : parseInt(form.reorder_level),
          }
        : {
            stock_quantity:
              form.stock_quantity === ""
                ? 0
                : parseInt(form.stock_quantity),
            reorder_level:
              form.reorder_level === ""
                ? undefined
                : parseInt(form.reorder_level),
          }),
    };

    if (product) {
      dispatch(updateProduct({ id: product.id, ...payload }));
    } else {
      dispatch(createProduct(payload));
    }
  }

  const reorderPlaceholder = 10;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="dashboard-card w-full max-w-md space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {product ? "Edit Product" : "Add Product"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close product form"
          >
            <X size={18} />
          </button>
        </div>

        {readOnly && (
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-brand-50 dark:bg-white/5 rounded-lg px-3 py-2">
            Demo mode: You can fill in this form, but you cannot save changes.
          </div>
        )}

        {saveError && (
          <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-3 py-2">
            {saveError}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">
            Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              SKU
            </label>
            <input
              required
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Category
            </label>

            <Dropdown
              value={form.category}
              onChange={(value) => handleChange("category", value)}
              options={categories.map((c) => ({
                value: c,
                label: c,
              }))}
              placeholder="Select category"
              buttonClassName="mt-1 h-[36px]"
              className="w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Price ($)
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Reorder Level
            </label>
            <input
              type="number"
              min="0"
              placeholder={reorderPlaceholder}
              value={form.reorder_level}
              onChange={(e) => handleChange("reorder_level", e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {!product && (
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">
              Starting Stock
            </label>
            <input
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={(e) => handleChange("stock_quantity", e.target.value)}
              className="mt-1 w-full text-sm bg-brand-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={readOnly || saveStatus === "loading"}
          className="w-full bg-gradient-brand text-white font-semibold text-sm py-2.5 rounded-lg shadow-glow disabled:cursor-not-allowed"
        >
          {readOnly
            ? product
              ? "Save Changes"
              : "Add Product"
            : saveStatus === "loading"
              ? "Saving…"
              : product
                ? "Save Changes"
                : "Add Product"}
        </button>
      </form>
    </div>
  );
}