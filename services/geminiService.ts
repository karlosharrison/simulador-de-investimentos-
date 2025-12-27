
import { GoogleGenAI, Type } from "@google/genai";
import { SimulationParams, ComparisonResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulateStockData = async (params: SimulationParams): Promise<ComparisonResult[]> => {
  const { stocks, startDate, endDate, initialInvestment, monthlyInvestment } = params;
  
  const results: ComparisonResult[] = [];

  for (const stock of stocks) {
    const prompt = `
      Simule dados históricos mensais para a ação ${stock.ticker} (${stock.type === 'BR' ? 'Brasil' : 'EUA'}) 
      de ${startDate} até ${endDate}. 
      Investimento inicial: R$ ${initialInvestment}.
      Aportes mensais: R$ ${monthlyInvestment}.
      
      Retorne um JSON contendo DOIS cenários de histórico mensal:
      1. history: cenário COM reinvestimento automático de dividendos.
      2. historyNoReinvest: cenário SEM reinvestimento de dividendos (dividendos são acumulados em caixa separadamente).
      
      Cada ponto de dado deve ter: { date (YYYY-MM), totalValue (float), accumulatedDividends (float) }.
      
      Também inclua um resumo (summary) do cenário COM reinvestimento: 
      { finalValue (float), totalDividends (float), totalInvested (float), profitability (float), sharesAccumulated (float) }
      
      Gere dados realistas baseados na performance histórica real aproximada dessa empresa.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            history: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  totalValue: { type: Type.NUMBER },
                  accumulatedDividends: { type: Type.NUMBER },
                },
                required: ["date", "totalValue", "accumulatedDividends"]
              }
            },
            historyNoReinvest: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  totalValue: { type: Type.NUMBER },
                  accumulatedDividends: { type: Type.NUMBER },
                },
                required: ["date", "totalValue", "accumulatedDividends"]
              }
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                finalValue: { type: Type.NUMBER },
                totalDividends: { type: Type.NUMBER },
                totalInvested: { type: Type.NUMBER },
                profitability: { type: Type.NUMBER },
                sharesAccumulated: { type: Type.NUMBER },
              },
              required: ["finalValue", "totalDividends", "totalInvested", "profitability", "sharesAccumulated"]
            }
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text);
      results.push({
        ticker: stock.ticker,
        ...data.summary,
        history: data.history,
        historyNoReinvest: data.historyNoReinvest
      });
    } catch (error) {
      console.error("Error parsing Gemini response", error);
    }
  }

  return results;
};
