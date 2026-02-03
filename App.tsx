import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileSpreadsheet, Trash2, Calculator, Info, Layout, Database, Sun, Moon } from 'lucide-react';
import { parseExcelFile } from './utils/excelParser';
import { ClanGroup, MemberWeight, SheetData } from './types';
import MemberWeightModal from './components/MemberWeightModal';
import AnalysisPanel from './components/AnalysisPanel';

const App: React.FC = () => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [weights, setWeights] = useState<MemberWeight>({});
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; weight: number } | null>(null);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('coc_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('coc_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('coc_theme', 'light');
    }
  }, [isDarkMode]);

  // Load weights from local storage on mount
  useEffect(() => {
    const savedWeights = localStorage.getItem('coc_member_weights');
    if (savedWeights) {
      try {
        setWeights(JSON.parse(savedWeights));
      } catch (e) {
        console.error("Failed to parse weights", e);
      }
    }
  }, []);

  // Save weights whenever they change
  useEffect(() => {
    localStorage.setItem('coc_member_weights', JSON.stringify(weights));
  }, [weights]);

  const handleFileUpload = async (file: File) => {
    try {
      const { sheets: newSheets, importedWeights } = await parseExcelFile(file);
      setSheets(newSheets);
      setActiveTab(0);

      // Merge imported weights with existing weights
      if (Object.keys(importedWeights).length > 0) {
        setWeights(prev => {
            const updated = { ...prev, ...importedWeights };
            return updated;
        });
      }
    } catch (err) {
      alert("Error parsing Excel file. Please ensure it matches the format.");
      console.error(err);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleWeightSave = (name: string, weight: number) => {
    setWeights(prev => ({
      ...prev,
      [name]: weight
    }));
  };

  const calculateGroupAverage = (group: ClanGroup) => {
    let total = 0;
    let count = 0;
    group.members.forEach(m => {
      if (m && weights[m]) {
        total += weights[m];
        count++;
      }
    });
    return count === 0 ? 0 : (total / count).toFixed(2);
  };
  
  const calculateGroupTotal = (group: ClanGroup) => {
      let total = 0;
      group.members.forEach(m => {
          if(m && weights[m]) {
              total += weights[m];
          }
      });
      return total.toFixed(1);
  }

  const getWeightColor = (weight: number | undefined) => {
    if (weight === undefined) return 'text-gray-400 dark:text-gray-500 italic';
    if (weight >= 16) return 'text-purple-600 dark:text-purple-400 font-bold'; // TH16
    if (weight >= 15) return 'text-blue-600 dark:text-blue-400 font-bold'; // TH15
    if (weight >= 14) return 'text-yellow-600 dark:text-yellow-400'; // TH14
    return 'text-green-600 dark:text-green-400';
  };

  const activeGroups = sheets.length > 0 ? sheets[activeTab].groups : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-200 pb-20 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm dark:shadow-lg transition-colors duration-200">
        <div className="w-full max-w-[1920px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 dark:bg-yellow-600 p-2 rounded-lg shadow-sm">
                <FileSpreadsheet className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">CoC League Manager</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Excel Variable & Average Calculator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {sheets.length > 0 && (
              <button 
                  onClick={() => setSheets([])}
                  className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                  <Trash2 size={14} /> 清除表格
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-6 py-8">
        {/* Upload Area */}
        {sheets.length === 0 && (
          <div className="max-w-3xl mx-auto">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`
                border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer
                ${isDragging 
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800/50'
                }
              `}
            >
              <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden" 
                  id="fileInput"
              />
              <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                  <Upload size={48} className={`mb-4 ${isDragging ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">上传 Excel 成员名单</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">拖拽文件到这里，或点击上传</p>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      支持 .xlsx (Excel) 格式
                  </span>
                  <div className="mt-4 flex flex-col items-center gap-1">
                      <span className="text-xs text-yellow-600 dark:text-yellow-500/80 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-900/30">
                          新功能: 支持 "匹配值" Sheet 自动导入数据
                      </span>
                  </div>
              </label>
            </div>
          </div>
        )}

        {/* Data Grid */}
        {sheets.length > 0 && (
          <div className="space-y-6">
            
            {/* Sheet Tabs */}
            {sheets.length > 1 && (
                <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-1">
                    {sheets.map((sheet, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-t-md font-medium text-sm transition-all whitespace-nowrap
                                ${activeTab === idx 
                                    ? 'bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 border-x border-t border-gray-200 dark:border-gray-700 relative top-[1px]' 
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                }
                            `}
                        >
                            <Layout size={14} />
                            {sheet.name}
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300">
                                {sheet.groups.length}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Legend / Helper */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800/40 p-3 rounded border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500/80">
                    <Info size={16} />
                    <span>提示: 点击成员名字设置数值。若 Excel 中包含 <b>"匹配值"</b> Sheet，系统会自动读取数值。</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Database size={12}/> 已存储数值: {Object.keys(weights).length} 个</span>
                </div>
            </div>

            {/* Groups Grid */}
            {activeGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-800">
                    该 Sheet 似乎没有有效的联赛分组数据。
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                {activeGroups.map((group) => (
                    <div key={group.id} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-md dark:shadow-xl min-w-0 transition-colors duration-200">
                    {/* Clan Header */}
                    <div className="p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-[#1e1e1e] border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate text-center">{group.name}</h3>
                        <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-mono mb-2">{group.tag}</div>
                        
                        <div className="flex justify-between items-center text-xs mt-2 px-2">
                            <span className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{group.status || 'N/A'}</span>
                            <span className="text-yellow-600 dark:text-yellow-500 font-medium">15人</span>
                        </div>
                        {group.note && (
                            <div className="mt-2 text-xs text-center text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 py-1 px-2 rounded border border-red-200 dark:border-red-900/30 truncate">
                                {group.note}
                            </div>
                        )}
                    </div>

                    {/* Members List */}
                    <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800">
                        {group.members.map((member, index) => {
                            const hasWeight = member && weights[member] !== undefined;
                            return (
                                <div 
                                    key={`${group.id}-m-${index}`} 
                                    onClick={() => member && setSelectedMember({ name: member, weight: weights[member] || 0 })}
                                    className={`
                                        flex justify-between items-center px-4 py-2 text-sm cursor-pointer transition-colors
                                        ${!member ? 'bg-gray-50/50 dark:bg-gray-900/50 h-9' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                                        ${index % 2 === 0 ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-gray-50 dark:bg-[#252525]'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-gray-400 dark:text-gray-500 text-xs w-4">{index + 1}</span>
                                        <span className={`truncate ${!hasWeight && member ? 'text-gray-400 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {member}
                                        </span>
                                    </div>
                                    {member && (
                                        <div className={`font-mono font-medium ${getWeightColor(weights[member])}`}>
                                            {weights[member] !== undefined ? weights[member] : '-'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Footer */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">总权重 (Total)</span>
                            <span className="text-gray-900 dark:text-white font-mono">{calculateGroupTotal(group)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">平均值 (Avg)</span>
                            <div className="flex items-center gap-2">
                                <Calculator size={14} className="text-yellow-500" />
                                <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-mono">
                                    {calculateGroupAverage(group)}
                                </span>
                            </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}

            {/* AI Panel - Only show if we have active groups */}
            {activeGroups.length > 0 && <AnalysisPanel groups={activeGroups} weights={weights} />}
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedMember && (
        <MemberWeightModal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          memberName={selectedMember.name}
          currentWeight={selectedMember.weight}
          onSave={handleWeightSave}
        />
      )}
    </div>
  );
};

export default App;