"use client";
import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/ui/ProductCard";

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=48`);
      const data = await res.json();
      setResults(data.products || []);
      setTotal(data.total || 0);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto 56px" }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 28, textAlign: "center" }}>
          Search <span style={{ color: "var(--accent)" }}>everything</span>
        </h1>
        <div style={{ position: "relative" }}>
          <input
            type="text" autoFocus
            placeholder="Search products across all stores..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: "16px 52px 16px 20px", fontSize: 16, background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)", color: "var(--text)" }}
          />
          <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 18, pointerEvents: "none" }}>
            {loading ? "⟳" : "⌕"}
          </div>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--text3)", padding: "40px 0" }}><div style={{ fontSize: 14 }}>Searching across all stores...</div></div>}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text3)", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>—</div>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No products found for "{query}"</p>
          <p style={{ fontSize: 13 }}>Try a different keyword or browse all products</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ marginBottom: 24, fontSize: 13, color: "var(--text3)" }}>
            {total} results for <span style={{ color: "var(--text2)", fontWeight: 500 }}>"{query}"</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
            {results.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: "center", color: "var(--text3)", padding: "60px 0" }}>
          <p style={{ fontSize: 15 }}>Start typing to search products from all stores</p>
        </div>
      )}
    </div>
  );
}
