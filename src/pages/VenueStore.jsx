import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Zap, QrCode, Check, Plus, Minus, X,
  Wine, Star, Package, Utensils, Sparkles, ArrowLeft, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const CATEGORY_META = {
  drinks:         { icon: Wine,      label: "Drinks",         emoji: "🍺" },
  vip_table:      { icon: Star,      label: "VIP Tables",     emoji: "👑" },
  bottle_service: { icon: Sparkles,  label: "Bottle Service", emoji: "🍾" },
  merchandise:    { icon: Package,   label: "Merch",          emoji: "👕" },
  food:           { icon: Utensils,  label: "Food",           emoji: "🍔" },
  other:          { icon: Zap,       label: "Other",          emoji: "⚡" },
};

// Sample demo menu items so the page has content
const DEMO_ITEMS = [
  { id: "d1", name: "Heineken 600ml", category: "drinks", price_ftc: 20, price_brl: 18, emoji: "🍺", description: "Ice cold. Served at the main bar.", is_available: true },
  { id: "d2", name: "Caipirinha", category: "drinks", price_ftc: 25, price_brl: 22, emoji: "🍹", description: "Classic Brazilian cocktail.", is_available: true },
  { id: "d3", name: "Vodka Red Bull", category: "drinks", price_ftc: 35, price_brl: 32, emoji: "🥤", description: "Keep the energy going.", is_available: true },
  { id: "d4", name: "Water 500ml", category: "drinks", price_ftc: 8, price_brl: 7, emoji: "💧", description: "Stay hydrated.", is_available: true },
  { id: "v1", name: "VIP Table (4 pax)", category: "vip_table", price_ftc: 800, price_brl: 700, emoji: "👑", description: "Reserved table in the VIP area. Includes 2 bottles.", is_available: true },
  { id: "v2", name: "VIP Table (8 pax)", category: "vip_table", price_ftc: 1400, price_brl: 1200, emoji: "🌟", description: "Premium area. Includes 4 bottles + priority service.", is_available: true },
  { id: "b1", name: "Grey Goose 1L", category: "bottle_service", price_ftc: 600, price_brl: 550, emoji: "🍾", description: "Premium vodka. Mixers included.", is_available: true },
  { id: "b2", name: "Moët & Chandon", category: "bottle_service", price_ftc: 1200, price_brl: 1100, emoji: "🥂", description: "Celebrate in style.", is_available: true },
  { id: "m1", name: "FestChain T-Shirt", category: "merchandise", price_ftc: 120, price_brl: 110, emoji: "👕", description: "Limited edition. Claim at merch booth.", is_available: true },
  { id: "m2", name: "Glow Kit", category: "merchandise", price_ftc: 60, price_brl: 55, emoji: "✨", description: "LED wristband + face gems.", is_available: true },
];

function CartDrawer({ cart, onUpdate, onClose, onCheckout, balance, checkingOut }) {
  const total = cart.reduce((s, i) => s + i.price_ftc * i.qty, 0);
  const canAfford = balance >= total;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#1a1a1a] border-l border-border flex flex-col h-full">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-white text-lg">Your Order</h2>
          <button onClick={onClose} className="p-2 text-[#888] hover:text-white rounded-lg hover:bg-[#222]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <p className="text-[#666] text-sm text-center py-8">Your cart is empty.</p>
          ) : cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-primary text-xs font-bold">{item.price_ftc * item.qty} FTC</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onUpdate(item.id, item.qty - 1)} className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center hover:bg-[#333]">
                  <Minus className="w-3 h-3 text-[#888]" />
                </button>
                <span className="text-white text-sm font-bold w-4 text-center">{item.qty}</span>
                <button onClick={() => onUpdate(item.id, item.qty + 1)} className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center hover:bg-[#333]">
                  <Plus className="w-3 h-3 text-[#888]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#888] text-sm">Your balance</span>
            <span className="text-white font-bold">{balance.toLocaleString()} FTC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#888] text-sm">Order total</span>
            <span className="text-primary font-bold text-lg">{total.toLocaleString()} FTC</span>
          </div>
          {!canAfford && (
            <div className="bg-red-900/30 border border-red-800/40 rounded-xl p-3 text-center">
              <p className="text-red-400 text-xs">Insufficient balance. <Link to="/buy-ftc" className="underline font-bold">Top up FTC</Link></p>
            </div>
          )}
          <Button
            onClick={onCheckout}
            disabled={cart.length === 0 || !canAfford || checkingOut}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl"
          >
            {checkingOut ? "Processing..." : `Pay ${total.toLocaleString()} FTC`}
            <Zap className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-[#555] text-xs text-center">10% FTC discount applied vs. cash prices</p>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#1a1a1a] border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-400" strokeWidth={2} />
        </div>
        <h3 className="font-heading font-bold text-white text-xl mb-1">Order Confirmed!</h3>
        <p className="text-[#888] text-sm mb-5">Show this QR code at the collection point.</p>

        <div className="bg-white rounded-2xl p-4 mx-auto w-40 h-40 flex items-center justify-center mb-4">
          <QrCode className="w-28 h-28 text-[#0d0d0d]" strokeWidth={0.8} />
        </div>
        <p className="text-white font-mono text-xs mb-1">{order.qr_code}</p>
        <p className="text-[#666] text-xs mb-5">Collection: {order.collection_point}</p>

        <div className="bg-card border border-border rounded-xl p-3 mb-5 space-y-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#888]">{item.emoji} {item.name} ×{item.qty}</span>
              <span className="text-primary font-medium">{item.price_ftc * item.qty} FTC</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-white text-sm">Total</span>
            <span className="text-primary">{order.total_ftc} FTC</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[#888] text-xs mb-5">
          <Clock className="w-3.5 h-3.5" />
          <span>Ready in ~5–10 minutes</span>
        </div>

        <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11">
          Done
        </Button>
      </div>
    </div>
  );
}

export default function VenueStore() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [items] = useState(DEMO_ITEMS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.FestCoinTransaction.filter({ created_by_id: currentUser?.id }, "-created_date", 200).catch(() => []),
      base44.entities.VenueOrder.filter({ created_by_id: currentUser?.id }, "-created_date", 20).catch(() => [])
    ]).then(([txs, ords]) => {
      setTransactions(txs);
      setOrders(ords);
    }).finally(() => setLoadingOrders(false));
  }, [currentUser]);

  const balance = transactions.reduce((s, t) => {
    if (["earned", "transferred_in", "unstaked"].includes(t.type)) return s + (t.amount || 0);
    if (["spent", "transferred_out", "staked"].includes(t.type)) return s - (t.amount || 0);
    return s;
  }, 0);

  const categories = ["all", ...new Set(items.map(i => i.category))];

  const filtered = activeCategory === "all" ? items : items.filter(i => i.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast({ title: `${item.emoji} Added to order`, description: item.name });
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    const total = cart.reduce((s, i) => s + i.price_ftc * i.qty, 0);
    const qr = `FC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const orderItems = cart.map(c => ({ item_id: c.id, name: c.name, emoji: c.emoji, qty: c.qty, price_ftc: c.price_ftc }));

    const order = await base44.entities.VenueOrder.create({
      event_id: "demo",
      event_title: "Tonight's Event",
      items: orderItems,
      total_ftc: total,
      status: "confirmed",
      qr_code: qr,
      collection_point: "Main Bar · Counter B"
    });

    await base44.entities.FestCoinTransaction.create({
      type: "spent",
      amount: total,
      description: `In-venue order: ${cart.map(c => `${c.name} ×${c.qty}`).join(", ")}`,
    });

    setTransactions(prev => [{ type: "spent", amount: total }, ...prev]);
    setCompletedOrder({ ...order, items: orderItems, total_ftc: total, qr_code: qr, collection_point: "Main Bar · Counter B" });
    setCart([]);
    setCartOpen(false);
    setCheckingOut(false);
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price_ftc * i.qty, 0);

  return (
    <div className="space-y-6">
      {completedOrder && (
        <OrderConfirmation order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onUpdate={updateCart}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          balance={balance}
          checkingOut={checkingOut}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-2">
            <Zap className="w-3 h-3" /> In-Venue Payments
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Venue Store</h1>
          <p className="text-[#888] text-sm">Pre-order drinks, tables & merch. Skip the queue. Just scan & collect.</p>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 ? `${cartCount} items · ${cartTotal} FTC` : "Cart"}
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
          )}
        </button>
      </div>

      {/* Balance strip */}
      <div className="bg-gradient-to-r from-primary/15 to-transparent border border-primary/30 rounded-xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-white text-sm font-medium">Wallet Balance</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-primary text-xl">{balance.toLocaleString()} FTC</span>
          <Link to="/buy-ftc" className="text-xs text-[#888] hover:text-white border border-[#333] px-3 py-1.5 rounded-lg transition-colors">Top Up</Link>
        </div>
      </div>

      {/* Why use FTC perks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { emoji: "⏩", title: "Skip the Queue", desc: "Pre-order, scan, collect" },
          { emoji: "💸", title: "10% Cheaper", desc: "vs. cash prices at bar" },
          { emoji: "🎯", title: "Exact Items", desc: "No shortages, guaranteed" },
          { emoji: "⚡", title: "Instant Payment", desc: "No card machines, no wait" },
        ].map((p, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl mb-1">{p.emoji}</p>
            <p className="text-white text-xs font-semibold">{p.title}</p>
            <p className="text-[#555] text-[10px] mt-0.5">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-[#888] hover:text-white hover:border-[#444]"
              }`}
            >
              {cat === "all" ? "🛍️" : meta?.emoji} {cat === "all" ? "All" : meta?.label || cat}
            </button>
          );
        })}
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const inCart = cart.find(c => c.id === item.id);
          return (
            <div key={item.id} className={`bg-card border rounded-2xl p-5 flex flex-col gap-3 transition-all ${inCart ? "border-primary/50 bg-primary/5" : "border-border hover:border-[#333]"}`}>
              <div className="flex items-start justify-between">
                <span className="text-4xl">{item.emoji}</span>
                <span className="text-[10px] text-[#666] bg-[#1a1a1a] border border-[#222] px-2 py-0.5 rounded-full capitalize">
                  {CATEGORY_META[item.category]?.label || item.category}
                </span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white mb-1">{item.name}</h3>
                {item.description && <p className="text-[#666] text-xs leading-relaxed">{item.description}</p>}
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1f1f1f]">
                <div>
                  <p className="font-heading font-bold text-primary text-lg">{item.price_ftc} <span className="text-sm text-[#888]">FTC</span></p>
                  {item.price_brl && <p className="text-[#555] text-xs line-through">R${item.price_brl}</p>}
                </div>
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCart(item.id, inCart.qty - 1)} className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center hover:bg-[#333]">
                      <Minus className="w-3.5 h-3.5 text-[#888]" />
                    </button>
                    <span className="text-white font-bold w-4 text-center">{inCart.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center hover:bg-primary/30">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-sm font-bold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Orders */}
      {orders.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-white mb-4">Your Orders</h2>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{order.event_title}</p>
                  <p className="text-[#666] text-xs">{moment(order.created_date).fromNow()} · {order.collection_point || "Main Bar"}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">{order.total_ftc} FTC</p>
                  <Badge className={`text-[10px] border-0 ${
                    order.status === "collected" ? "bg-[#222] text-[#888]" :
                    order.status === "ready" ? "bg-emerald-900/40 text-emerald-400" :
                    "bg-primary/15 text-primary"
                  }`}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}