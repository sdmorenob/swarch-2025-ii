// src/ai/flows/dynamic-milestone-recognition.ts
'use server';

/**
 * @fileOverview Recognizes fitness milestones dynamically and awards virtual badges/rewards.
 *
 * - recognizeMilestone - A function that determines if a user has achieved a milestone and returns a reward.
 * - RecognizeMilestoneInput - The input type for the recognizeMilestone function.
 * - RecognizeMilestoneOutput - The return type for the recognizeMilestone function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeMilestoneInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  challengeName: z.string().describe('The name of the fitness challenge.'),
  progress: z.number().describe('The user\u2019s current progress in the challenge.'),
  target: z.number().describe('The target value for the challenge.'),
});
export type RecognizeMilestoneInput = z.infer<typeof RecognizeMilestoneInputSchema>;

const RecognizeMilestoneOutputSchema = z.object({
  achievedMilestone: z.boolean().describe('Whether the user has achieved a significant milestone.'),
  reward: z.string().describe('A description of the virtual badge or reward earned, if any.'),
});
export type RecognizeMilestoneOutput = z.infer<typeof RecognizeMilestoneOutputSchema>;

export async function recognizeMilestone(input: RecognizeMilestoneInput): Promise<RecognizeMilestoneOutput> {
  return recognizeMilestoneFlow(input);
}

const recognizeMilestonePrompt = ai.definePrompt({
  name: 'recognizeMilestonePrompt',
  input: {schema: RecognizeMilestoneInputSchema},
  output: {schema: RecognizeMilestoneOutputSchema},
  prompt: `You are an AI assistant specialized in recognizing fitness milestones and awarding virtual badges/rewards.

  Based on the user's progress in the {{challengeName}} challenge, determine if they have achieved a significant milestone. Significant milestones might include reaching 25%, 50%, 75%, or 100% of the target, or some other significant achievement based on the challenge.

  If a milestone has been achieved, set achievedMilestone to true and provide a description of the reward in the reward field. Otherwise, set achievedMilestone to false and provide an empty string for the reward.

  User ID: {{userId}}
  Challenge Name: {{challengeName}}
  Progress: {{progress}}
  Target: {{target}}

  Consider previous progress and whether user has recently received a reward to avoid giving out too many rewards.
`,
});

const recognizeMilestoneFlow = ai.defineFlow(
  {
    name: 'recognizeMilestoneFlow',
    inputSchema: RecognizeMilestoneInputSchema,
    outputSchema: RecognizeMilestoneOutputSchema,
  },
  async input => {
    const {output} = await recognizeMilestonePrompt(input);
    return output!;
  }
);
