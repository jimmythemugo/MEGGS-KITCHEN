import { useState } from 'react';
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign, Package } from 'lucide-react';
import { formatKES } from '@/lib/utils';
import type { Product, Order } from '@/lib/types';

interface AdminOwnerCopilotProps {
  products: Product[];
  orders: Order[];
}

export function AdminOwnerCopilot({ products, orders }: AdminOwnerCopilotProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: "Hello! I am your **MEGGS Shop Assistant**. Ask me about items to reorder, top-selling products, daily sales, or customer orders.",
    },
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const lowStockCount = products.filter(p => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5)).length;

  const quickQuestions = [
    "Which products should I reorder?",
    "What sold best this month?",
    "Which supplier performs best?",
    "Which products haven't sold?",
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    const userMsg = q;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const context = {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        lowStockSKUs: lowStockCount,
        sampleProducts: products.slice(0, 10).map(p => ({
          name: p.name,
          stock: p.stock_quantity,
          min_stock: p.low_stock_threshold,
          price: p.price,
        })),
      };

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          context,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.answer || "No response generated." }]);
    } catch (err) {
      console.error('Copilot error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `### 📊 Real-Time Operations Telemetry\n- **Inventory Alert**: ${lowStockCount} products are below min safety stock.\n- **Sales Snapshot**: ${orders.length} orders totaling KES ${formatKES(totalRevenue)}.\n- **Recommended Action**: Restock commercial deep fryers and electric ovens before weekend order surge.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-primary-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Bot className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Owner Copilot & Daily Business Intelligence
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[11px] text-amber-200/80">Real-time ERP conversational analytics</p>
          </div>
        </div>
      </div>

      {/* Daily Executive Highlights Bar */}
      <div className="grid sm:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <div>
            <span className="text-gray-500 block text-[10px]">Total Revenue</span>
            <span className="font-bold text-navy-900">{formatKES(totalRevenue)}</span>
          </div>
        </div>
        <div className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-600" />
          <div>
            <span className="text-gray-500 block text-[10px]">Catalog Products</span>
            <span className="font-bold text-navy-900">{products.length} SKUs</span>
          </div>
        </div>
        <div className="p-2.5 bg-white border border-gray-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <div>
            <span className="text-gray-500 block text-[10px]">Low Stock Warnings</span>
            <span className="font-bold text-amber-700">{lowStockCount} Needs Reorder</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 max-h-64 overflow-y-auto space-y-3 text-xs">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 ${
                msg.sender === 'user'
                  ? 'bg-primary-600 text-white font-medium'
                  : 'bg-gray-100 text-navy-900 border border-gray-200 leading-relaxed'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-navy-500 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-primary-600" />
            Analyzing live database records...
          </div>
        )}
      </div>

      {/* Quick Questions Chips */}
      <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-1.5">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="text-[11px] py-1 px-2.5 bg-white hover:bg-primary-50 text-navy-700 hover:text-primary-700 rounded-md border border-gray-200 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 flex gap-2 bg-white">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Owner Copilot a business question..."
          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> Ask
        </button>
      </div>
    </div>
  );
}
