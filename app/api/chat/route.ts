import Anthropic from '@anthropic-ai/sdk';
import { calculateForecast } from '@/lib/forecast-calculator';
import { calculateHouseholdIncome } from '@/lib/income-calculator';
import { buildFinanceSystemPrompt } from '@/lib/build-finance-prompt';
import type { ForecastConfig } from '@/lib/forecast-calculator';
import type { IncomeInput, CalculationConfig } from '@/lib/income-calculator';

export const maxDuration = 60;

const anthropic = new Anthropic();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  financialData: {
    financialYear: string;
    includeMedicare: boolean;
    andyIncome: IncomeInput;
    nadieleIncome: IncomeInput;
    andyVoluntarySuper: number;
    nadieleVoluntarySuper: number;
    andyPortfolioContribution: number;
    nadielePortfolioContribution: number;
    expenses: ForecastConfig['expenses'];
    andyCurrentAge: number;
    nadieleCurrentAge: number;
    andyRetirementAge: number;
    nadieleRetirementAge: number;
    annualIncomeIncrease: number;
    annualInflationRate: number;
    splurgeAutoInvestThreshold: number;
    assets: ForecastConfig['assets'];
    andyNovatedLease: ForecastConfig['andyNovatedLease'];
    nadieleNovatedLease: ForecastConfig['nadieleNovatedLease'];
    children: ForecastConfig['children'];
    educationFees: ForecastConfig['educationFees'];
  };
}

export async function POST(request: Request) {
  try {
    const { messages, financialData } = (await request.json()) as ChatRequest;

    if (!messages || !financialData) {
      return new Response(JSON.stringify({ error: 'Missing messages or financialData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Run forecast calculator server-side
    const forecastConfig: ForecastConfig = {
      andyCurrentAge: financialData.andyCurrentAge,
      nadieleCurrentAge: financialData.nadieleCurrentAge,
      andyIncome: financialData.andyIncome,
      nadieleIncome: financialData.nadieleIncome,
      expenses: financialData.expenses,
      assets: financialData.assets,
      andyRetirementAge: financialData.andyRetirementAge,
      nadieleRetirementAge: financialData.nadieleRetirementAge,
      annualIncomeIncrease: financialData.annualIncomeIncrease,
      annualInflationRate: financialData.annualInflationRate,
      splurgeAutoInvestThreshold: financialData.splurgeAutoInvestThreshold ?? 0,
      andyVoluntarySuper: financialData.andyVoluntarySuper,
      nadieleVoluntarySuper: financialData.nadieleVoluntarySuper,
      andyPortfolioContribution: financialData.andyPortfolioContribution,
      nadielePortfolioContribution: financialData.nadielePortfolioContribution,
      financialYear: financialData.financialYear,
      includeMedicareLevy: financialData.includeMedicare,
      andyNovatedLease: financialData.andyNovatedLease,
      nadieleNovatedLease: financialData.nadieleNovatedLease,
      children: financialData.children,
      educationFees: financialData.educationFees,
    };

    const forecast = calculateForecast(forecastConfig);

    // Run income calculator server-side
    const incomeConfig: CalculationConfig = {
      includeMedicareLevy: financialData.includeMedicare,
      financialYear: financialData.financialYear,
      voluntarySuperRate: {
        andy: financialData.andyVoluntarySuper,
        nadiele: financialData.nadieleVoluntarySuper,
      },
      spendableExclusions: {
        andy: financialData.andyIncome.allowances + financialData.andyIncome.preTotalAdjustments,
        nadiele: financialData.nadieleIncome.allowances + financialData.nadieleIncome.preTotalAdjustments,
      },
      novatedLease: {
        andy: {
          preTaxAnnual: financialData.andyNovatedLease.preTaxAnnual,
          postTaxAnnual: financialData.andyNovatedLease.postTaxAnnual,
        },
        nadiele: {
          preTaxAnnual: financialData.nadieleNovatedLease.preTaxAnnual,
          postTaxAnnual: financialData.nadieleNovatedLease.postTaxAnnual,
        },
      },
      portfolioContribution: {
        andy: financialData.andyPortfolioContribution,
        nadiele: financialData.nadielePortfolioContribution,
      },
    };

    const householdIncome = calculateHouseholdIncome(
      financialData.andyIncome,
      financialData.nadieleIncome,
      incomeConfig,
    );

    // Build system prompt with all data
    const systemPrompt = buildFinanceSystemPrompt(forecastConfig, forecast, householdIncome);

    // Stream response from Claude
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Return streaming text response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
