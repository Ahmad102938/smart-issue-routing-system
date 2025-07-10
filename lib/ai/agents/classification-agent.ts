import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END } from '@langchain/langgraph';
import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

// Classification schema
const ClassificationSchema = z.object({
  category: z.enum(['Facilities', 'IT', 'Equipment', 'General']),
  subcategory: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

type Classification = z.infer<typeof ClassificationSchema>;

interface ClassificationState {
  description: string;
  classification?: Classification;
  error?: string;
}

export class ClassificationAgent {
  private model: ChatOpenAI;
  private parser: StructuredOutputParser<Classification>;
  private graph: StateGraph<ClassificationState>;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    this.parser = StructuredOutputParser.fromZodSchema(ClassificationSchema);
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<ClassificationState> {
    const graph = new StateGraph<ClassificationState>({
      channels: {
        description: null,
        classification: null,
        error: null
      }
    });

    // Classification node
    graph.addNode('classify', async (state: ClassificationState) => {
      try {
        const prompt = `
You are an expert maintenance issue classifier for Walmart stores. Analyze the following issue description and classify it according to these categories:

CATEGORIES & SUBCATEGORIES:
1. Facilities:
   - Cold Storage (freezers, refrigeration, cooling systems)
   - Electrical (lighting, power outlets, electrical systems)
   - Plumbing (leaks, water systems, drains)
   - HVAC (heating, air conditioning, ventilation)
   - Structural (doors, windows, flooring, walls)

2. IT:
   - POS Systems (point of sale terminals, checkout systems)
   - Network (wifi, internet, connectivity)
   - Computers (workstations, monitors, peripherals)
   - Software (applications, system errors)

3. Equipment:
   - Shopping Carts (cart issues, wheels, baskets)
   - Shelving (display racks, storage systems)
   - Security (cameras, alarms, access control)
   - Cleaning (floor cleaners, maintenance equipment)

4. General:
   - Maintenance (general repairs, miscellaneous)
   - Safety (hazards, emergency equipment)

PRIORITY RULES:
- HIGH: Safety hazards, product spoilage risk, complete system failures, customer-facing critical issues
- MEDIUM: Partial functionality loss, operational impact, non-critical system issues
- LOW: Cosmetic issues, minor inconveniences, scheduled maintenance

Issue Description: "${state.description}"

${this.parser.getFormatInstructions()}

Provide your classification with reasoning for the priority level assigned.
        `;

        const response = await this.model.invoke(prompt);
        const classification = await this.parser.parse(response.content as string);

        return {
          ...state,
          classification
        };
      } catch (error) {
        console.error('Classification error:', error);
        
        // Fallback classification
        const fallbackClassification: Classification = {
          category: 'General',
          subcategory: 'Maintenance',
          priority: 'MEDIUM',
          confidence: 0.3,
          reasoning: 'Fallback classification due to processing error'
        };

        return {
          ...state,
          classification: fallbackClassification,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Set entry point and edges
    graph.setEntryPoint('classify');
    graph.addEdge('classify', END);

    return graph;
  }

  async classify(description: string): Promise<Classification> {
    const compiled = this.graph.compile();
    
    const result = await compiled.invoke({
      description
    });

    if (!result.classification) {
      throw new Error('Failed to classify issue');
    }

    return result.classification;
  }
}

// Singleton instance
export const classificationAgent = new ClassificationAgent();