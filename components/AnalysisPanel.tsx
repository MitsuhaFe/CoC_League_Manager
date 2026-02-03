import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2 } from 'lucide-react';
import { ClanGroup, MemberWeight } from '../types';

interface Props {
  groups: ClanGroup[];
  weights: MemberWeight;
}

const AnalysisPanel: React.FC<Props> = ({ groups, weights }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    if (!process.env.API_KEY) {
      setError("API Key is missing. Please configure the environment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare data for the prompt
      const dataSummary = groups.map(g => {
        const totalWeight = g.members.reduce((acc, m) => acc + (weights[m] || 0), 0);
        const avg = g.members.length > 0 ? (totalWeight / g.members.length).toFixed(2) : "0";
        return `Clan: ${g.name} (Tag: ${g.tag})\nNote: ${g.note}\nAverage Weight: ${avg}\nTotal Members: ${g.members.length}`;
      }).join('\n---\n');

      const prompt = `
        You are a Clash of Clans CWL (Clan War Leagues) strategist.
        I have prepared a roster for the upcoming league week.
        Here is the data for my clans. The "Weight" usually corresponds to Town Hall levels (e.g., 16 = TH16).
        
        ${dataSummary}

        Please provide a short, strategic summary in Chinese (Simplified).
        1. Analyze if the distribution looks balanced based on the notes (e.g. "Maintain Rank" vs "Competitive").
        2. Point out any potential risks (e.g. low average weight for a competitive group).
        3. Keep it encouraging and professional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text || "No analysis generated.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mt-6 shadow-md dark:shadow-lg transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-yellow-500 dark:text-yellow-400" />
          AI 联赛顾问 (AI Advisor)
        </h2>
        <button
          onClick={generateAnalysis}
          disabled={loading || groups.length === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {analysis ? '重新分析' : '智能分析布局'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {analysis && (
        <div className="prose prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
      
      {!analysis && !loading && (
        <div className="text-gray-500 text-center py-4 italic">
          点击上方按钮，让 AI 帮你分析当前的联赛分组强度。
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;