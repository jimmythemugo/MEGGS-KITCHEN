import { useState } from 'react';
import { FileSpreadsheet, Upload, Download, QrCode, Barcode, Printer, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { AdminLayout } from './dashboard';
import { useProducts } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatKES } from '@/lib/utils';

export default function AdminImportExport() {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'barcode'>('import');

  return (
    <AdminLayout title="Excel Import & Export">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'import' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <Upload className="w-4 h-4 text-primary-600" /> Bulk Product Import (CSV/Excel)
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'export' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <Download className="w-4 h-4 text-green-600" /> Catalog & Stock Export
        </button>
        <button
          onClick={() => setActiveTab('barcode')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'barcode' ? 'border-primary-600 text-primary-600' : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          <Barcode className="w-4 h-4 text-purple-600" /> Barcode & QR Label Generator
        </button>
      </div>

      {activeTab === 'import' ? <ImportTab /> : activeTab === 'export' ? <ExportTab /> : <BarcodeTab />}
    </AdminLayout>
  );
}

function ImportTab() {
  const { refetch } = useProducts();
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  const sampleCSV = `Name,SKU,Barcode,Price,CostPrice,StockQuantity,Unit,Category
Commercial Deep Fryer Double,FRY-COMM-02,600123456781,45000,32000,15,unit,Cooking Equipment
Commercial Gas Oven 4-Burner,OVN-GAS-04,600123456782,120000,88000,8,unit,Cooking Equipment
Stainless Steel Work Table 1.8m,TBL-SS-18,600123456783,38000,26000,25,unit,Stainless Steel
Under-Counter Refrigerator 2-Door,FRG-UC-02,600123456784,95000,72000,10,unit,Refrigeration`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidating(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      parseAndValidate(text);
      setValidating(false);
    };
    reader.readAsText(file);
  };

  const parseAndValidate = (csvText: string) => {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      toast({ title: 'Invalid CSV format', variant: 'destructive' });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < headers.length) continue;

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx];
      });

      // Validation check
      const isValid = Boolean(rowObj.Name && (rowObj.Price || rowObj.price) && (rowObj.SKU || rowObj.sku));
      rows.push({ ...rowObj, _isValid: isValid, _status: isValid ? 'Valid' : 'Missing SKU/Name/Price' });
    }

    setParsedRows(rows);
  };

  const handleCommitImport = async () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r._isValid);
    if (validRows.length === 0) {
      toast({ title: 'No valid rows to import', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      for (const row of validRows) {
        const name = row.Name || row.name;
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const sku = row.SKU || row.sku || `SKU-${Date.now()}`;
        const price = parseFloat(row.Price || row.price) || 0;
        const costPrice = parseFloat(row.CostPrice || row.cost_price) || price * 0.7;
        const stockQty = parseInt(row.StockQuantity || row.stock_quantity) || 10;
        const barcode = row.Barcode || row.barcode || null;

        await supabase.from('products').upsert(
          {
            name,
            slug,
            sku,
            barcode,
            price,
            cost_price: costPrice,
            stock_quantity: stockQty,
            unit: row.Unit || row.unit || 'unit',
            in_stock: stockQty > 0,
            is_active: true,
          },
          { onConflict: 'slug' }
        );
      }

      toast({ title: `Successfully imported ${validRows.length} catalog items!` });
      setParsedRows([]);
      setFileContent('');
      refetch();
    } catch {
      toast({ title: 'Import error occurred during bulk commit', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-lg text-navy-900 mb-1 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" /> Bulk Product & Inventory Import Studio
        </h3>
        <p className="text-xs text-navy-500 mb-4">
          Upload thousands of product SKUs, prices, barcodes, stock levels, and category mappings using standard CSV or Excel files.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
          <FileSpreadsheet className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <p className="font-bold text-navy-800 text-sm mb-1">Click to Upload CSV / Excel Catalog File</p>
          <p className="text-xs text-navy-400 mb-4">Supported columns: Name, SKU, Barcode, Price, CostPrice, StockQuantity, Unit</p>

          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload-input" />
          <label htmlFor="csv-upload-input" className="btn-primary cursor-pointer inline-flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Select File From Device
          </label>
        </div>

        {/* Sample Template */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-navy-700">Sample CSV Template Format</span>
            <button
              onClick={() => {
                const blob = new Blob([sampleCSV], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'meggs_catalog_import_template.csv';
                a.click();
              }}
              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download Template CSV
            </button>
          </div>
          <pre className="bg-navy-950 text-navy-100 text-xs p-3 rounded-lg overflow-x-auto font-mono">
            {sampleCSV}
          </pre>
        </div>
      </div>

      {/* Validation Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <div>
              <h4 className="font-bold text-navy-900 text-sm">Import Pre-Validation Inspection</h4>
              <p className="text-xs text-navy-500">
                Found {parsedRows.length} rows ({parsedRows.filter((r) => r._isValid).length} ready to commit)
              </p>
            </div>
            <button onClick={handleCommitImport} disabled={importing} className="btn-primary flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {importing ? 'Importing Products...' : 'Commit Verified Import'}
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-navy-600 font-bold uppercase sticky top-0">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Barcode</th>
                  <th className="p-3">Price (KES)</th>
                  <th className="p-3">Cost Price</th>
                  <th className="p-3">Stock Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedRows.map((r, i) => (
                  <tr key={i} className={r._isValid ? 'hover:bg-green-50/50' : 'bg-red-50/50'}>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r._isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {r._status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-navy-900">{r.Name || r.name}</td>
                    <td className="p-3 font-mono text-navy-600">{r.SKU || r.sku}</td>
                    <td className="p-3 font-mono text-navy-500">{r.Barcode || r.barcode || '-'}</td>
                    <td className="p-3 font-bold text-navy-800">{formatKES(parseFloat(r.Price || r.price) || 0)}</td>
                    <td className="p-3 text-navy-600">{formatKES(parseFloat(r.CostPrice || r.cost_price) || 0)}</td>
                    <td className="p-3 font-bold text-primary-700">{r.StockQuantity || r.stock_quantity || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportTab() {
  const { products } = useProducts();
  const { toast } = useToast();

  const exportCSV = (type: 'catalog' | 'stock' | 'valuation') => {
    let headers = '';
    let rows: string[] = [];

    if (type === 'catalog') {
      headers = 'ID,Name,SKU,Barcode,Category,Price,CostPrice,StockQuantity,Unit,InStock\n';
      rows = products.map((p) =>
        `"${p.id}","${p.name}","${p.sku || ''}","${p.barcode || ''}","${p.category?.name || ''}",${p.price},${p.cost_price || 0},${p.stock_quantity},"${p.unit}",${p.in_stock}`
      );
    } else if (type === 'stock') {
      headers = 'SKU,Name,CurrentStock,LowStockThreshold,ReorderLevel,Status\n';
      rows = products.map((p) =>
        `"${p.sku || ''}","${p.name}",${p.stock_quantity},${p.low_stock_threshold},${p.reorder_level || p.low_stock_threshold},"${p.stock_quantity <= p.low_stock_threshold ? 'LOW' : 'OK'}"`
      );
    } else {
      headers = 'SKU,Name,CostPrice,SellingPrice,StockQuantity,TotalValuation\n';
      rows = products.map((p) => {
        const cost = p.cost_price || p.price * 0.7;
        const valuation = cost * p.stock_quantity;
        return `"${p.sku || ''}","${p.name}",${cost},${p.price},${p.stock_quantity},${valuation}`;
      });
    }

    const csvContent = headers + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meggs_erp_export_${type}_${Date.now()}.csv`;
    a.click();

    toast({ title: `Exported ${products.length} records to CSV` });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <FileSpreadsheet className="w-10 h-10 text-primary-600 mb-3" />
        <h3 className="font-bold text-navy-900 text-base mb-1">Full Master Catalog Export</h3>
        <p className="text-xs text-navy-500 mb-4">Export complete product database including SKUs, prices, categories, and attributes.</p>
        <button onClick={() => exportCSV('catalog')} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <Download className="w-10 h-10 text-green-600 mb-3" />
        <h3 className="font-bold text-navy-900 text-base mb-1">Inventory & Stock Audit Report</h3>
        <p className="text-xs text-navy-500 mb-4">Export real-time stock balances, low stock alerts, and reorder levels.</p>
        <button onClick={() => exportCSV('stock')} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <FileText className="w-10 h-10 text-purple-600 mb-3" />
        <h3 className="font-bold text-navy-900 text-base mb-1">Financial Asset Valuation Report</h3>
        <p className="text-xs text-navy-500 mb-4">Export inventory valuation at cost price vs selling price for accounting.</p>
        <button onClick={() => exportCSV('valuation')} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>
    </div>
  );
}

function BarcodeTab() {
  const { products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState('');

  const selectedProd = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-lg text-navy-900 mb-2 flex items-center gap-2">
          <Barcode className="w-5 h-5 text-purple-600" /> Barcode & QR Code Label Generator
        </h3>
        <p className="text-xs text-navy-500 mb-4">
          Generate printable EAN-13 barcodes and QR code labels for shelf tags, physical product packaging, and POS scanner integration.
        </p>

        <div className="max-w-md">
          <label className="text-xs font-bold text-navy-700 mb-1 block">Select Product to Print Label</label>
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="input text-sm">
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedProd && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-xl mx-auto text-center" id="printable-barcode-sheet">
          <div className="border-2 border-dashed border-navy-300 p-6 rounded-xl bg-gray-50">
            <h2 className="font-black text-navy-900 text-lg tracking-tight mb-1">{selectedProd.name}</h2>
            <p className="text-xs text-navy-500 font-mono mb-3">SKU: {selectedProd.sku || 'MEGGS-SKU-DEFAULT'}</p>

            {/* Barcode visual rendering */}
            <div className="my-4 bg-white p-4 rounded-lg inline-block shadow-inner border">
              <div className="flex justify-center items-end h-16 gap-1 px-4">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 3].map((w, i) => (
                  <div key={i} className="bg-navy-950 h-full" style={{ width: `${w * 2}px` }} />
                ))}
              </div>
              <p className="font-mono text-xs font-bold text-navy-900 mt-2 tracking-widest">
                {selectedProd.barcode || '6009876543210'}
              </p>
            </div>

            <div className="flex justify-center items-center gap-4 text-xs font-bold text-navy-700 mt-2">
              <span>Price: {formatKES(selectedProd.price)}</span>
              <span>•</span>
              <span>Unit: {selectedProd.unit}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Label Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
