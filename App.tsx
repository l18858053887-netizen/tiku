
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, AppView } from './types';
import { findAnswerFromImage } from './services/geminiService';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [excelData, setExcelData] = useState<string | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ questionText: string; answer: string; reason: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 加载 Excel 题库
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setExcelData(XLSX.utils.sheet_to_csv(ws));
    };
    reader.readAsBinaryString(file);
  };

  // 处理截图识别
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !excelData) return;

    setIsProcessing(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = (evt.target?.result as string).split(',')[1];
      try {
        const searchResult = await findAnswerFromImage(base64, excelData);
        setResult(searchResult);
        setHistory(prev => [searchResult, ...prev].slice(0, 10));
      } catch (err) {
        alert("识别失败，请确保截图清晰且包含文字。");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f1f5f9] select-none font-sans">
      {/* 顶部状态栏风格导航 */}
      <header className="h-16 bg-indigo-700 flex items-center px-6 shadow-md sticky top-0 z-50">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-white tracking-wider">智能助考助手</h1>
        {excelData && (
          <div className="ml-auto flex items-center bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-[10px] text-green-100 font-bold uppercase">题库就绪</span>
          </div>
        )}
      </header>

      <main className="flex-1 p-5 space-y-6">
        {/* 1. 题库管理卡片 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Excel 本地题库</h2>
            {excelData && (
              <button onClick={() => {setExcelData(null); setExcelFileName(null);}} className="text-xs text-red-500 font-bold">更换</button>
            )}
          </div>
          
          {!excelData ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-100 rounded-2xl p-8 flex flex-col items-center justify-center bg-indigo-50/30 active:bg-indigo-50 transition-colors"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </div>
              <p className="text-sm font-bold text-indigo-900">点击导入 Excel 题库</p>
              <p className="text-xs text-slate-400 mt-1">支持 .xlsx, .xls, .csv</p>
              <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls, .csv" className="hidden" />
            </div>
          ) : (
            <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{excelFileName}</p>
                <p className="text-xs text-slate-400 font-medium">已自动载入全文搜索模式</p>
              </div>
            </div>
          )}
        </section>

        {/* 2. 扫码搜题操作区 */}
        <section className={`transition-all duration-500 ${!excelData ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => imageInputRef.current?.click()}
              className="col-span-2 py-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-xl shadow-indigo-200 flex flex-col items-center justify-center active:scale-95 transition-all"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xl font-black">拍照 / 截图搜题</span>
              <span className="text-xs opacity-60 mt-1 font-bold">自动识别图像内容并匹配答案</span>
              <input type="file" ref={imageInputRef} onChange={handleImageCapture} accept="image/*" className="hidden" />
            </button>
          </div>
        </section>

        {/* 3. 识别结果展示 */}
        {(isProcessing || result) && (
          <section className="animate-slide-up">
             <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-indigo-100 relative overflow-hidden">
               {isProcessing && <div className="auto-scan-line"></div>}
               
               <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">识别与匹配结果</h3>
               
               {isProcessing ? (
                 <div className="py-10 text-center space-y-4">
                   <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                   <p className="font-bold text-slate-500">Gemini AI 正在深度检索题库...</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">识别到的题目</p>
                      <p className="text-lg font-black text-slate-800 leading-snug">{result?.questionText}</p>
                    </div>
                    
                    <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                      <p className="text-xs font-bold text-green-600 mb-2 uppercase">匹配答案</p>
                      <p className="text-2xl font-black text-green-700">{result?.answer}</p>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 mb-1 uppercase">匹配理由/解析</p>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{result?.reason}</p>
                    </div>

                    <button 
                      onClick={() => setResult(null)}
                      className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl"
                    >
                      关闭结果
                    </button>
                 </div>
               )}
             </div>
          </section>
        )}

        {/* 4. 搜索历史记录 */}
        {history.length > 0 && !isProcessing && !result && (
          <section className="animate-fade-in">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">最近搜题</h3>
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 font-black">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.questionText}</p>
                    <p className="text-xs text-green-600 font-black">答案: {item.answer.substring(0, 20)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 底部版权信息 */}
      <footer className="p-8 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Powered by Gemini AI Vision</p>
      </footer>
    </div>
  );
};

export default App;
