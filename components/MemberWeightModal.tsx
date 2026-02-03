import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  currentWeight: number;
  onSave: (name: string, weight: number) => void;
}

const MemberWeightModal: React.FC<Props> = ({ isOpen, onClose, memberName, currentWeight, onSave }) => {
  const [weight, setWeight] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setWeight(currentWeight ? currentWeight.toString() : '');
    }
  }, [isOpen, currentWeight]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      onSave(memberName, num);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-96 shadow-xl transition-colors duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">设定数值 (Set Variable)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1">成员名称 (Member Name)</label>
          <div className="text-lg font-medium text-yellow-600 dark:text-yellow-400">{memberName}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-500 dark:text-gray-400 text-sm mb-2">数值 / 权重 (Value/Weight)</label>
            <input
              type="number"
              step="0.1"
              autoFocus
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="例如: 16 (16本) 或 120 (匹配值)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberWeightModal;