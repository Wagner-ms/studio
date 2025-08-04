'use server';

/**
 * @fileOverview An AI agent that extracts product details from a photo of a product label using OCR.
 *
 * - extractProductDetails - A function that handles the product detail extraction process.
 * - ExtractProductDetailsInput - The input type for the extractProductDetails function.
 * - ExtractProductDetailsOutput - The return type for the extractProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractProductDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product label, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractProductDetailsInput = z.infer<typeof ExtractProductDetailsInputSchema>;

const ExtractProductDetailsOutputSchema = z.object({
  productName: z.string().optional().describe('The name of the product.'),
  lotNumber: z.string().optional().describe('The lot number of the product.'),
  expirationDate: z.string().optional().describe('The expiration date of the product in ISO 8601 format (YYYY-MM-DD).'),
  category: z.string().optional().describe("The category of the product. Possible values: 'Cam.Bebidas', 'cam.laticinios', 'cam.congelados', 'cam.sorvete', 'Cam.Fiambra'"),
});
export type ExtractProductDetailsOutput = z.infer<typeof ExtractProductDetailsOutputSchema>;

export async function extractProductDetails(
  input: ExtractProductDetailsInput
): Promise<ExtractProductDetailsOutput> {
  return extractProductDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProductDetailsPrompt',
  input: {schema: ExtractProductDetailsInputSchema},
  output: {schema: ExtractProductDetailsOutputSchema},
  prompt: `You are an expert in recognizing product labels using OCR.

You will use this information to extract the product name, lot number, expiration date, and category from the label. If a value cannot be determined, do not return it. The expiration date MUST be returned in ISO 8601 format (YYYY-MM-DD).

The possible categories are: 'Cam.Bebidas', 'cam.laticinios', 'cam.congelados', 'cam.sorvete', 'Cam.Fiambra'.

Product Label Photo: {{media url=photoDataUri}}
`,
});

const extractProductDetailsFlow = ai.defineFlow(
  {
    name: 'extractProductDetailsFlow',
    inputSchema: ExtractProductDetailsInputSchema,
    outputSchema: ExtractProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
