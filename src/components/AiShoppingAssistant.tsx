import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Mic, MicOff, ShoppingBag, ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatKES } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface AiShoppingAssistantProps {
  products: Product[];
}

export function AiShoppingAssistant({ products }: AiShoppingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState<{
    explanation?: string;
    recommendedProductIds?: string[];
    buyingAdvice?: string[];
  } | null>(null);

  const { addItem } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);

  const samplePrompts = [
    "I need a commercial deep fryer under KSh 45,000",
    "Heavy-duty planetary mixer for a commercial bakery",
    "Cooking pots suitable for a family or small restaurant",
    "Show me stainless steel sinks for prep area",
  ];

  const handleSearch = async (textToSearch?: string) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const productsSample = products.slice(0, 15).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category_id || 'General',
        specs: p.specifications,
        description: p.description?.slice(0, 100),
      }));

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: q,
          productsSample,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Failed to get AI assistant response:', err);
      // Client-side fallback matching
      const matches = products.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(q.toLowerCase())
      );
      setResponse({
        explanation: `Here are recommended equipment options matching "${q}":`,
        recommendedProductIds: matches.slice(0, 3).map(p => p.id),
        buyingAdvice: [
          "Check voltage requirements before purchase (220V Single Phase vs 415V Three Phase).",
          "All Meggs Kitchen heavy machinery comes with a 12-month manufacturer warranty."
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice search is supported in Chrome/Edge browsers.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleSearch(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const recommendedProducts = products.filter(p => response?.recommendedProductIds?.includes(p.id));

  return (
    <>
      {/* Floating Sparkle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-amber-600 text-white font-medium py-3 px-5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
        id="ai-culinary-advisor-btn"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
        <span className="text-sm font-bold tracking-wide">AI Culinary Advisor</span>
      </button>

      {/* Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-primary-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">MEGGS AI Shopping Assistant</h3>
                  <p className="text-xs text-amber-200/80">Natural Language Equipment Matcher & Culinary Advisor</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Query Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  What kitchen equipment or specs are you looking for?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="e.g., Cooking pot for 6 people, 20L Mixer under 100k..."
                      className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={toggleVoiceSearch}
                      title="Voice Search"
                      className={`absolute right-2.5 top-2.5 p-1 rounded-lg transition-colors ${
                        isListening ? 'bg-red-500 text-white animate-bounce' : 'text-gray-400 hover:text-navy-900'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSearch()}
                    disabled={loading || !query.trim()}
                    className="btn-primary px-4 rounded-xl flex items-center gap-1.5 text-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample Prompts */}
              {!response && !loading && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-navy-500">Suggested Prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(prompt);
                          handleSearch(prompt);
                        }}
                        className="text-xs py-1.5 px-3 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-navy-700 rounded-lg border border-gray-200 transition-colors text-left"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loader */}
              {loading && (
                <div className="p-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto text-amber-500 animate-spin" />
                  <p className="text-sm font-medium text-navy-800">Analyzing catalog & matching specifications...</p>
                </div>
              )}

              {/* Results Display */}
              {response && !loading && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* AI Explanation Box */}
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-sm text-navy-900 space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" /> AI Recommendation Summary
                    </p>
                    <p className="text-xs text-navy-800 leading-relaxed">{response.explanation}</p>
                  </div>

                  {/* Recommended Products */}
                  {recommendedProducts.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-navy-900 uppercase tracking-wider">Matching Products</p>
                      <div className="space-y-2">
                        {recommendedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-primary-300 shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {(product.image_url || product.images?.[0]) && (
                                <img
                                  src={
                                    product.image_url ||
                                    (typeof product.images?.[0] === 'string'
                                      ? product.images[0]
                                      : (product.images?.[0] as any)?.image_url)
                                  }
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg border"
                                />
                              )}
                              <div>
                                <h4 className="font-semibold text-sm text-navy-900">{product.name}</h4>
                                <p className="text-xs font-bold text-primary-700">{formatKES(product.price)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                addItem(product);
                              }}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-navy-500 italic">No exact catalog matches found. Try broadening your specifications.</p>
                  )}

                  {/* Buying Advice */}
                  {response.buyingAdvice && response.buyingAdvice.length > 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-navy-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Culinary Expert Technical Advice
                      </p>
                      <ul className="space-y-1">
                        {response.buyingAdvice.map((tip, idx) => (
                          <li key={idx} className="text-xs text-navy-700 flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-navy-500">
              <span>Powered by MEGGS Gemini 3.6 Flash</span>
              <button
                onClick={() => {
                  setResponse(null);
                  setQuery('');
                }}
                className="text-primary-600 hover:underline font-medium"
              >
                Clear Search
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
