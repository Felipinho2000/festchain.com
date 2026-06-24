import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Plus, Minus, X, Zap, Check, Clock, Wine, Star, Sparkles, Package, Utensils
} from "lucide-react";
import Qr from "@/components/shared/Qr";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_META = {
  drinks:         { label: "Drinks",         emoji: "🍺" },
  vip_table:      { label: "VIP Tables",     emoji: "👑" },
  bottle_service: { label: "Bottle Service", emoji: "🍾" },
  merchandise:    { label: "Merch",          emoji: "👕" },
  food:           { label: "Food",           emoji: "🍔" },
  other:          { label: "Other",          emoji: "⚡" },
};

function OrderConfirmation({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1a1a1a] border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-400" strokeWidth={2} />
        </div>
        <h3 className="font-heading font-bold text-white text-xl mb-1">Order Confirmed!</h3>
        <p className="text-[#888] text-sm mb-5">Show this QR at the collection point.</p>
        <div className="mx-auto mb-3">
          <Qr value={order.qr_code} size={150} />
        </div>
        <p className="text-white font-mono text-xs mb-1">{order.qr_code}</p>
        <p className="text-[#666] text-xs mb-5">Collection: {order.collection_point}</p>
        <div className="bg-card border border-border rounded-xl p-3 mb-5 space-y-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#888]">{item.emoji} {item.name} ×{item.qty}</span>
              <span className="text-primary font-medium">R${(item.price_brl * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-white text-sm">Total</span>
            <span className="text-primary">R${order.total_brl?.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[#888] text-xs mb-5">
          <Clock className="w-3.5 h-3.5" />
          <span>Ready in ~5–10 minutes</span>
        </div>
        <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11">Done</Button>
      </div>
    </div>
  );
}

export default function EventPreOrder({ eventId, eventTitle }) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.VenueMenuItem.filter({ event_id: eventId, is_available: true }).catch(() => []),
      base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser?.id }, "-created_date", 200).catch(() => [])
    ]).then(([menuItems, txs]) => {
      setItems(menuItems);
      setTransactions(txs);
    }).finally(() => setLoading(false));
  }, [eventId, currentUser]);

  const balance = transactions.reduce((s, t) => {
    if (["earned", "transferred_in", "unstaked"].includes(t.type)) return s + (t.amount || 0);
    if (["spent", "transferred_out", "staked"].includes(t.type)) return s - (t.amount || 0);
    return s;
  }, 0);
  const balanceBRL = balance * 0.5;

  const cartTotal = cart.reduce((s, i) => s + (i.price_brl || i.price_ftc * 0.5) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const canAfford = balanceBRL >= cartTotal;

  const categories = ["all", ...new Set(items.map(i => i.category))];
  const filtered = activeCategory === "all" ? items : items.filter(i => i.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    const total_ftc = cart.reduce((s, i) => s + i.price_ftc * i.qty, 0);
    const total_brl = cartTotal;
    const qr = `FC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const orderItems = cart.map(c => ({ item_id: c.id, name: c.name, emoji: c.emoji || "🍺", qty: c.qty, price_ftc: c.price_ftc, price_brl: c.price_brl || c.price_ftc * 0.5 }));

    await base44.entities.VenueOrder.create({
      event_id: eventId, event_title: eventTitle,
      items: orderItems, total_ftc, status: "confirmed",
      qr_code: qr, collection_point: "Main Bar · Counter B"
    });

    await base44.entities.FestCoinTransaction.create({
      type: "spent", amount: total_ftc,
      description: `Pre-order at ${eventTitle}: ${cart.map(c => `${c.name} ×${c.qty}`).join(", ")}`,
    });

    setCompletedOrder({ items: orderItems, total_brl, qr_code: qr, collection_point: "Main Bar · Counter B" });
    setTransactions(prev => [{ type: "spent", amount: total_ftc }, ...prev]);
    setCart([]);
    setCheckingOut(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-[#555] text-sm">No pre-order menu set up for this event yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedOrder && <OrderConfirmation order={completedOrder} onClose={() => setCompletedOrder(null)} />}

      {/* Balance + Cart bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 to-transparent border border-primary/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-white text-sm font-medium">Balance: <span className="text-primary font-bold">R${balanceBRL.toFixed(2)}</span></span>
        </div>
        {cartCount > 0 && (
          <button
            onClick={handleCheckout}
            disabled={!canAfford || checkingOut}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {checkingOut ? "Processing..." : `Pay R$${cartTotal.toFixed(2)} · ${cartCount} item${cartCount > 1 ? "s" : ""}`}
          </button>
        )}
        {cartCount === 0 && (
          <Link to="/buy-ftc" className="text-xs text-[#888] hover:text-white border border-[#333] px-3 py-1.5 rounded-lg transition-colors">Add Balance</Link>
        )}
      </div>

      {!canAfford && cartCount > 0 && (
        <div className="bg-red-900/30 border border-red-800/40 rounded-xl p-3 text-center">
          <p className="text-red-400 text-xs">Insufficient balance. <Link to="/buy-ftc" className="underline font-bold">Add Balance</Link></p>
        </div>
      )}

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat ? "bg-primary text-white" : "bg-card border border-border text-[#888] hover:text-white"
              }`}>
              {cat === "all" ? "🛍️ All" : `${CATEGORY_META[cat]?.emoji || ""} ${CATEGORY_META[cat]?.label || cat}`}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(item => {
          const inCart = cart.find(c => c.id === item.id);
          const priceBRL = item.price_brl || (item.price_ftc * 0.5);
          return (
            <div key={item.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-all ${inCart ? "border-primary/50 bg-primary/5" : "border-border"}`}>
              <span className="text-3xl flex-shrink-0">{item.emoji || CATEGORY_META[item.category]?.emoji || "🍺"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{item.name}</p>
                {item.description && <p className="text-[#666] text-xs mt-0.5 line-clamp-1">{item.description}</p>}
                <p className="font-bold text-white text-sm mt-1">R${priceBRL.toFixed(2)} <span className="text-[#555] font-normal text-xs line-through">R${(priceBRL / 0.9).toFixed(2)}</span></p>
              </div>
              {inCart ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => updateCart(item.id, inCart.qty - 1)} className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center hover:bg-[#333]">
                    <Minus className="w-3.5 h-3.5 text-[#888]" />
                  </button>
                  <span className="text-white font-bold w-4 text-center text-sm">{inCart.qty}</span>
                  <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center hover:bg-primary/30">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              ) : (
                <button onClick={() => addToCart(item)}
                  className="flex items-center gap-1 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}